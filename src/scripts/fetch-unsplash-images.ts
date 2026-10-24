/**
 * Downloads stock product imagery from Unsplash.
 *
 *   1. Create a free app at https://unsplash.com/oauth/applications
 *   2. Put the Access Key in .env.local:  UNSPLASH_ACCESS_KEY=...
 *   3. npm run fetch:images
 *
 * Why this exists: generated SVG placeholders are brand-correct but
 * obviously not photographs. Unsplash photos look right in a client
 * walkthrough and are licensed for commercial use, unlike anything pulled
 * off Google Images or Pinterest.
 *
 * They are still NOT Avantika's product. Images downloaded here are marked
 * `isPlaceholder: true`, so the Product model continues to refuse
 * publication in production until real photography replaces them.
 *
 * Rate limit: a demo application gets 50 requests/hour, and only JSON calls
 * to api.unsplash.com count. A naive run would need 31 searches plus 31
 * download pings — over the limit. So searches are grouped by subject and
 * cached, which brings the run to roughly 35 calls.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '@/lib/db';
import { Product } from '@/models';
import { logger } from '@/lib/logger';

const API = 'https://api.unsplash.com';
const OUT_DIR = resolve('public/products');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Search terms grouped by subject. Several products share a term, and each
 * term is searched once — this is what keeps the run inside the rate limit.
 * Terms are deliberately about the raw ingredient rather than packaging,
 * since packaged-goods stock photos carry other brands' labels.
 */
const QUERY_BY_SLUG: Record<string, string> = {
  'emmer-wheat': 'wheat grains',
  barley: 'barley grains',
  oats: 'rolled oats',
  corn: 'dried corn kernels',
  'brown-rice': 'brown rice',
  millet: 'millet grain',
  quinoa: 'quinoa',
  amaranth: 'amaranth grain',

  'toor-dal': 'yellow lentils',
  'moong-dal': 'yellow lentils',
  'masoor-dal': 'red lentils',
  'chana-dal': 'split chickpeas',
  'urad-dal': 'black lentils',
  'whole-green-moong': 'mung beans',
  'whole-black-urad': 'black lentils',
  'kabuli-chana': 'chickpeas',
  'kala-chana': 'black chickpeas',
  rajma: 'kidney beans',
  lobia: 'black eyed peas',
  matar: 'dried green peas',

  'pumpkin-seeds': 'pumpkin seeds',
  'chia-seeds': 'chia seeds',
  'sunflower-seeds': 'sunflower seeds',
  'flax-seeds': 'flax seeds',
  'sesame-seeds': 'sesame seeds',
  'basil-seeds': 'basil seeds',
  'watermelon-seeds': 'watermelon seeds',
  'hemp-seeds': 'hemp seeds',

  'combo-pulses': 'assorted lentils',
  'combo-grains': 'assorted grains',
  'combo-seeds': 'assorted seeds',
};

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; full: string };
  links: { download_location: string; html: string };
  user: { name: string; links: { html: string } };
  alt_description: string | null;
}

let requestCount = 0;

async function api<T>(path: string): Promise<T> {
  requestCount += 1;
  const response = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });

  const remaining = response.headers.get('x-ratelimit-remaining');

  if (response.status === 403) {
    throw new Error(
      `Unsplash rate limit reached (${requestCount} requests made this run). ` +
        'A demo key allows 50 per hour — wait an hour and run again; ' +
        'products already downloaded are skipped.',
    );
  }
  if (!response.ok) {
    throw new Error(`Unsplash ${path} failed: ${response.status} ${response.statusText}`);
  }
  if (remaining !== null && Number(remaining) < 6) {
    logger.warn({ remaining }, 'Approaching the Unsplash rate limit');
  }

  return response.json() as Promise<T>;
}

/** Cached per search term, so a shared term costs one request. */
const searchCache = new Map<string, UnsplashPhoto[]>();

async function photosFor(query: string): Promise<UnsplashPhoto[]> {
  const cached = searchCache.get(query);
  if (cached) return cached;

  const result = await api<{ results: UnsplashPhoto[] }>(
    `/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=squarish&content_filter=high`,
  );
  searchCache.set(query, result.results);
  return result.results;
}

/**
 * The API Guidelines require this to be called whenever a photo is actually
 * downloaded. It is a tracking endpoint — the file itself comes from urls.*.
 */
async function triggerDownload(photo: UnsplashPhoto): Promise<void> {
  const path = photo.links.download_location.replace(API, '');
  await api(path);
}

async function main() {
  if (!ACCESS_KEY) {
    console.error(`
  UNSPLASH_ACCESS_KEY is not set.

  1. Sign in at https://unsplash.com/oauth/applications
  2. "New Application", accept the terms, name it anything
  3. Copy the Access Key into .env.local:

       UNSPLASH_ACCESS_KEY=your_access_key_here

  The generated SVG placeholders stay in place until then.
`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  await connectDB();

  const products = await Product.find({}).sort({ slug: 1 });
  if (products.length === 0) {
    console.error('No products found. Run `npm run seed:products` first.');
    process.exitCode = 1;
    await disconnectDB();
    return;
  }

  // Each photo is used once, so two products never show the same picture.
  const usedPhotoIds = new Set<string>();
  let downloaded = 0;
  let skipped = 0;

  for (const product of products) {
    const query = QUERY_BY_SLUG[product.slug];
    if (!query) {
      console.warn(`  no search term for ${product.slug} — leaving its placeholder`);
      continue;
    }

    const target = resolve(OUT_DIR, `${product.slug}.jpg`);

    // Re-running after a rate-limit stop should not re-fetch what is done.
    if (existsSync(target) && product.images[0]?.url.endsWith('.jpg')) {
      skipped += 1;
      continue;
    }

    try {
      const candidates = await photosFor(query);
      const photo = candidates.find((p) => !usedPhotoIds.has(p.id)) ?? candidates[0];

      if (!photo) {
        console.warn(`  no results for "${query}" — leaving ${product.slug} as is`);
        continue;
      }

      usedPhotoIds.add(photo.id);

      await triggerDownload(photo);

      // The image file itself is not an api.unsplash.com JSON call, so it
      // does not count against the rate limit.
      const imageResponse = await fetch(`${photo.urls.regular}&w=1000&h=1250&fit=crop`);
      if (!imageResponse.ok) {
        throw new Error(`image download failed: ${imageResponse.status}`);
      }

      writeFileSync(target, Buffer.from(await imageResponse.arrayBuffer()));

      product.images = [
        {
          url: `/products/${product.slug}.jpg`,
          alt:
            photo.alt_description ??
            `${product.name}${product.localName ? ` (${product.localName})` : ''}`,
          width: 1000,
          height: 1250,
          displayOrder: 0,
          // Stock, not Avantika's own product — publication stays blocked.
          isPlaceholder: true,
          credit: {
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            source: 'Unsplash',
            sourceUrl: photo.links.html,
          },
        },
      ];

      await product.save();
      downloaded += 1;
      console.log(`  ${product.slug} ← ${photo.user.name} / Unsplash`);
    } catch (err) {
      console.error(`  ${product.slug}: ${(err as Error).message}`);
      if ((err as Error).message.includes('rate limit')) break;
    }
  }

  console.log(`
  Downloaded ${downloaded}, skipped ${skipped} already done.
  API requests used this run: ${requestCount}

  These are stock photographs of the ingredient, not Avantika's product.
  They are marked isPlaceholder, so production publication stays blocked
  until the mill supplies its own photography.
`);

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Unsplash fetch failed');
  await disconnectDB();
  process.exit(1);
});
