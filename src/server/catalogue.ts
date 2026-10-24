import 'server-only';
import { connectDB } from '@/lib/db';
import { Category, Product } from '@/models';

/**
 * Data access for server components.
 *
 * Product pages read MongoDB directly rather than calling our own HTTP API.
 * A server component fetching its own API means an extra network hop, a
 * second serialisation round-trip and a worse LCP, for no benefit — the
 * REST routes exist for the browser and for future clients, not for us.
 */

export interface ProductCardData {
  slug: string;
  name: string;
  localName?: string;
  tag?: string;
  shortDescription: string;
  imageUrl: string | null;
  imageAlt: string;
  variantId: string;
  packSize: string;
  pricePaise: number;
  mrpPaise: number;
  inStock: boolean;
}

function toCard(p: Record<string, unknown>): ProductCardData {
  const product = p as never as {
    slug: string; name: string; localName?: string; tag?: string;
    shortDescription: string;
    images: { url: string; alt: string }[];
    variants: {
      _id: { toString(): string }; packSize: string;
      pricePaise: number; mrpPaise: number; availableQty: number; isActive: boolean;
    }[];
  };

  const variant = product.variants.find((v) => v.isActive) ?? product.variants[0];

  return {
    slug: product.slug,
    name: product.name,
    localName: product.localName,
    tag: product.tag,
    shortDescription: product.shortDescription,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.alt ?? product.name,
    variantId: variant?._id.toString() ?? '',
    packSize: variant?.packSize ?? '',
    pricePaise: variant?.pricePaise ?? 0,
    mrpPaise: variant?.mrpPaise ?? 0,
    inStock: (variant?.availableQty ?? 0) > 0,
  };
}

/**
 * Catalogue pages use ISR, which means Next prerenders them during
 * `next build` — and that needs a reachable database and a full environment
 * at build time.
 *
 * On a VPS that is a real fragility: a CI image or a deploy that builds
 * before secrets are mounted would fail outright. During the build phase
 * only, a data failure degrades to an empty page and a loud warning; the
 * first revalidation after boot fills it in. At runtime the error is NOT
 * swallowed — an empty catalogue in production must surface, not hide.
 */
async function buildSafe<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (err) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn(
        `[build] ${label} could not read the database; prerendering empty. ` +
          `Pages will populate on first revalidation. Reason: ${(err as Error).message}`,
      );
      return fallback;
    }
    throw err;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  return buildSafe(
    'getFeaturedProducts',
    async () => {
      await connectDB();
      const docs = await Product.find({ status: 'active' })
        .sort({ isFeatured: -1, createdAt: 1 })
        .limit(limit)
        .lean();
      return docs.map(toCard);
    },
    [],
  );
}

export async function listProducts(options: {
  categorySlug?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ProductCardData[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(48, options.limit ?? 12);

  return buildSafe(
    'listProducts',
    async () => {
      await connectDB();

      const filter: Record<string, unknown> = { status: 'active' };

      if (options.categorySlug) {
        const category = await Category.findOne({ slug: options.categorySlug, isActive: true });
        if (!category) return { items: [], total: 0, page, limit };
        filter.category = category._id;
      }

      const [docs, total] = await Promise.all([
        Product.find(filter).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      return { items: docs.map(toCard), total, page, limit };
    },
    { items: [], total: 0, page, limit },
  );
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  const doc = await Product.findOne({ slug, status: 'active' })
    .populate('category', 'name slug')
    .lean();
  if (!doc) return null;

  const category = doc.category as unknown as { name: string; slug: string } | null;

  return {
    slug: doc.slug,
    name: doc.name,
    localName: doc.localName,
    tag: doc.tag,
    shortDescription: doc.shortDescription,
    longDescription: doc.longDescription,
    images: doc.images.map((i) => ({
      url: i.url,
      alt: i.alt,
      // Carried through so the product page can render the attribution that
      // stock-photo licensing requires.
      credit: i.credit
        ? {
            photographer: i.credit.photographer,
            photographerUrl: i.credit.photographerUrl,
            source: i.credit.source,
            sourceUrl: i.credit.sourceUrl,
          }
        : null,
    })),
    category: category ? { name: category.name, slug: category.slug } : null,
    specifications: doc.specifications.map((s) => ({ label: s.label, value: s.value })),
    variants: doc.variants
      .filter((v) => v.isActive)
      .map((v) => ({
        id: v._id.toString(),
        packSize: v.packSize,
        pricePaise: v.pricePaise,
        mrpPaise: v.mrpPaise,
        inStock: v.availableQty > 0,
      })),
    foodDisclosures: {
      manufacturerName: doc.foodDisclosures?.manufacturerName,
      countryOfOrigin: doc.foodDisclosures?.countryOfOrigin,
      shelfLifeDays: doc.foodDisclosures?.shelfLifeDays,
      isVegetarian: doc.foodDisclosures?.isVegetarian,
      storageInstructions: doc.foodDisclosures?.storageInstructions,
    },
    seo: doc.seo,
  };
}

export async function listCategories() {
  return buildSafe(
    'listCategories',
    async () => {
      await connectDB();
      const docs = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
      return docs.map((c) => ({ name: c.name, slug: c.slug }));
    },
    [] as { name: string; slug: string }[],
  );
}

/** True while the store is running on demo stand-ins — drives the UI banner. */
export async function isDemoMode(): Promise<boolean> {
  await connectDB();
  const { StoreSettings } = await import('@/models');
  const settings = await StoreSettings.findOne({ key: 'default' }).select('demoDataInUse').lean();
  return settings?.demoDataInUse ?? false;
}
