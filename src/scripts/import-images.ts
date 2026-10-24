/**
 * Imports supplied product photography into public/products/.
 *
 *   npm run import:images -- "C:\path\to\folder-of-images"
 *
 * Image generators and stock libraries hand back descriptive filenames
 * ("Golden Wheat Grain Texture.png") rather than the slugs the storefront
 * looks for. This maps them, resizes to the 4:5 the grid reserves, and
 * encodes to WebP — the PNGs arrive at 2–3 MB each, which is roughly
 * twenty times what the page should be shipping.
 *
 * Matching is by the keyword table below, so a file only needs to contain
 * the right words; exact filenames are not required. Anything unmatched is
 * reported rather than silently skipped.
 *
 * Re-running is safe: it overwrites by slug.
 */
import {
  readdirSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = resolve('public/products');

const WIDTH = 1200;
const HEIGHT = 1500; // 4:5, matching the .media aspect ratio
const QUALITY = 82;

/**
 * slug → keywords that must ALL appear in the filename (case-insensitive).
 *
 * Ordered most-specific first: "whole black urad" has to be tested before
 * "urad", or the split dal image would claim the whole-bean slot.
 */
const RULES: { slug: string; all: string[]; not?: string[] }[] = [
  // Pulses — the ambiguous ones first
  { slug: 'whole-black-urad', all: ['black', 'urad'] },
  { slug: 'urad-dal', all: ['urad'], not: ['black'] },
  { slug: 'whole-green-moong', all: ['mung'] },
  { slug: 'moong-dal', all: ['moong'], not: ['mung'] },
  { slug: 'masoor-dal', all: ['red', 'lentil'] },
  { slug: 'chana-dal', all: ['chana', 'dal'] },
  { slug: 'toor-dal', all: ['toor'] },
  { slug: 'kala-chana', all: ['brown', 'chickpea'] },
  { slug: 'kabuli-chana', all: ['chickpea'], not: ['brown'] },
  { slug: 'rajma', all: ['kidney'] },
  { slug: 'lobia', all: ['black-eyed'] },
  { slug: 'matar', all: ['green', 'pea'] },

  // Grains
  { slug: 'emmer-wheat', all: ['wheat'], not: ['bands', 'stripes'] },
  { slug: 'barley', all: ['barley'] },
  { slug: 'oats', all: ['oats'] },
  { slug: 'corn', all: ['corn'] },
  { slug: 'brown-rice', all: ['rice'] },
  { slug: 'millet', all: ['millet'] },
  { slug: 'quinoa', all: ['quinoa'] },
  { slug: 'amaranth', all: ['amaranth'] },

  // Seeds
  { slug: 'pumpkin-seeds', all: ['pumpkin'] },
  { slug: 'chia-seeds', all: ['chia'] },
  { slug: 'sunflower-seeds', all: ['sunflower'] },
  { slug: 'flax-seeds', all: ['flax'] },
  { slug: 'sesame-seeds', all: ['sesame'] },
  { slug: 'basil-seeds', all: ['dense', 'black'] },
  { slug: 'watermelon-seeds', all: ['dense', 'ivory'] },
  { slug: 'hemp-seeds', all: ['hemp'] },

  // Combos — "vertical bands/stripes" compositions
  { slug: 'combo-pulses', all: ['pulses'] },
  { slug: 'combo-grains', all: ['bands', 'grains'] },
  { slug: 'combo-seeds', all: ['seed', 'stripes'] },
];

const ALL_SLUGS = [
  'emmer-wheat', 'quinoa', 'amaranth', 'barley', 'corn', 'millet', 'oats', 'brown-rice',
  'toor-dal', 'moong-dal', 'masoor-dal', 'chana-dal', 'urad-dal', 'whole-green-moong',
  'whole-black-urad', 'kabuli-chana', 'kala-chana', 'rajma', 'lobia', 'matar',
  'pumpkin-seeds', 'chia-seeds', 'sunflower-seeds', 'flax-seeds', 'sesame-seeds',
  'basil-seeds', 'watermelon-seeds', 'hemp-seeds',
  'combo-pulses', 'combo-grains', 'combo-seeds',
];

const ACCEPTED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff']);

function slugFor(filename: string): string | null {
  const name = basename(filename, extname(filename)).toLowerCase();

  // An exact slug filename always wins over keyword matching.
  const exact = ALL_SLUGS.find((s) => name === s);
  if (exact) return exact;

  for (const rule of RULES) {
    if (!rule.all.every((k) => name.includes(k))) continue;
    if (rule.not?.some((k) => name.includes(k))) continue;
    return rule.slug;
  }
  return null;
}

async function main() {
  const sourceDir = process.argv[2];

  if (!sourceDir) {
    console.error('Usage: npm run import:images -- "<folder containing the images>"');
    process.exitCode = 1;
    return;
  }

  const source = resolve(sourceDir);
  if (!existsSync(source)) {
    console.error(`Folder not found: ${source}`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(source).filter((f) => ACCEPTED.has(extname(f).toLowerCase()));

  if (files.length === 0) {
    console.error(`No images found in ${source}`);
    process.exitCode = 1;
    return;
  }

  const taken = new Map<string, string>();
  const unmatched: string[] = [];
  const collisions: string[] = [];

  for (const file of files) {
    const slug = slugFor(file);
    if (!slug) {
      unmatched.push(file);
      continue;
    }
    // Two files claiming one slug is a mapping error worth surfacing, not
    // a race to overwrite.
    if (taken.has(slug)) {
      collisions.push(`${slug}: "${taken.get(slug)}" and "${file}"`);
      continue;
    }
    taken.set(slug, file);
  }

  let written = 0;

  for (const [slug, file] of taken) {
    const target = resolve(OUT_DIR, `${slug}.webp`);

    await sharp(resolve(source, file))
      .rotate() // honour EXIF orientation before cropping
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(target);

    // Clear the generated stand-in this replaces.
    const stale = resolve(OUT_DIR, `${slug}.svg`);
    if (existsSync(stale)) unlinkSync(stale);

    written += 1;
    console.log(`  ${slug}.webp  ←  ${file}`);
  }

  // Drop imported slugs from the generator's manifest so a later
  // `gen:images` run treats them as supplied and leaves them alone.
  const manifestPath = resolve(OUT_DIR, '.generated.json');
  try {
    const current: string[] = JSON.parse(readFileSync(manifestPath, 'utf8'));
    writeFileSync(
      manifestPath,
      JSON.stringify(current.filter((s) => !taken.has(s)), null, 2),
    );
  } catch {
    // No manifest yet — nothing to reconcile.
  }

  const missing = ALL_SLUGS.filter((s) => !existsSync(resolve(OUT_DIR, `${s}.webp`)));

  console.log(`\n  Imported ${written} of ${ALL_SLUGS.length} products.`);

  if (unmatched.length > 0) {
    console.warn(`\n  Could not match ${unmatched.length} file(s):`);
    unmatched.forEach((f) => console.warn(`    - ${f}`));
    console.warn('  Rename these to the product slug (e.g. rajma.png) and run again.');
  }

  if (collisions.length > 0) {
    console.warn(`\n  Two files matched the same product:`);
    collisions.forEach((c) => console.warn(`    - ${c}`));
  }

  if (missing.length > 0) {
    console.warn(`\n  Still missing photography for ${missing.length} product(s):`);
    missing.forEach((s) => console.warn(`    - ${s}`));
  }

  clearNextImageCache(written);

  console.log('\n  Next: npm run seed:demo    (points the database at these files)\n');
}

/**
 * Drops Next's optimised-image cache.
 *
 * Next caches each resized variant under `.next/cache/images`, keyed by the
 * source URL and the width and quality — not by the file's contents. A
 * replaced photo keeps its filename, so every key still matches and the
 * optimiser keeps serving the old picture. It survives `next build` and a
 * PM2 restart, so on a VPS the new photo can sit on disk for days while
 * customers are still shown the previous one. The only reliable tell is
 * that a width nobody has requested yet looks right while the page looks
 * wrong, which is a miserable thing to debug.
 *
 * Deleting the directory is safe: it is a cache, and Next rebuilds each
 * variant on first request.
 */
function clearNextImageCache(written: number) {
  if (written === 0) return;

  const cacheDir = resolve('.next/cache/images');
  if (!existsSync(cacheDir)) return;

  try {
    rmSync(cacheDir, { recursive: true, force: true });
    console.log('\n  Cleared .next/cache/images so the new photos are actually served.');
  } catch (err) {
    console.warn(
      `\n  Could not clear .next/cache/images (${(err as Error).message}).` +
        '\n  Delete it by hand, or the old images will keep being served.',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
