import type { NextRequest } from 'next/server';
import type { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { buildPaginationMeta, paginated, route } from '@/lib/api-response';
import { connectDB } from '@/lib/db';
import { Category, Product, type IProduct } from '@/models';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().trim().optional(),
  q: z.string().trim().max(80).optional(),
  minPaise: z.coerce.number().int().min(0).optional(),
  maxPaise: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name', 'relevance']).default('newest'),
  inStock: z.enum(['true', 'false']).optional(),
});

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { 'variants.0.pricePaise': 1 },
  price_desc: { 'variants.0.pricePaise': -1 },
  name: { name: 1 },
};

/**
 * Public catalogue listing.
 *
 * Only `active` products are ever returned — draft and archived rows stay
 * invisible to the storefront regardless of what is asked for.
 */
export const GET = route(async (request: NextRequest) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const params = querySchema.parse(Object.fromEntries(searchParams));

  const filter: FilterQuery<IProduct> = { status: 'active' };

  if (params.category) {
    const category = await Category.findOne({ slug: params.category, isActive: true });
    // An unknown category yields an empty page rather than the whole
    // catalogue, which would silently ignore the filter.
    if (!category) {
      return paginated([], buildPaginationMeta(params.page, params.limit, 0));
    }
    filter.category = category._id;
  }

  if (params.q) {
    filter.$text = { $search: params.q };
  }

  if (params.minPaise !== undefined || params.maxPaise !== undefined) {
    filter['variants.pricePaise'] = {
      ...(params.minPaise !== undefined ? { $gte: params.minPaise } : {}),
      ...(params.maxPaise !== undefined ? { $lte: params.maxPaise } : {}),
    };
  }

  if (params.inStock === 'true') {
    filter['variants.availableQty'] = { $gt: 0 };
  }

  const sort =
    params.q && params.sort === 'relevance'
      ? { score: { $meta: 'textScore' as const } }
      : (SORTS[params.sort] ?? SORTS.newest);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('name localName slug tag shortDescription images variants category seo')
      .populate('category', 'name slug')
      .sort(sort as Record<string, 1 | -1>)
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return paginated(
    items.map(serialiseCard),
    buildPaginationMeta(params.page, params.limit, total),
  );
});

/** Card projection — only what a grid needs, no internal stock figures. */
function serialiseCard(product: Record<string, never> | unknown) {
  const p = product as IProduct & { category: { name: string; slug: string } };
  const primary = p.variants.find((v) => v.isActive) ?? p.variants[0];

  return {
    slug: p.slug,
    name: p.name,
    localName: p.localName,
    tag: p.tag,
    shortDescription: p.shortDescription,
    image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt } : null,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    variants: p.variants
      .filter((v) => v.isActive)
      .map((v) => ({
        id: v._id.toString(),
        packSize: v.packSize,
        pricePaise: v.pricePaise,
        mrpPaise: v.mrpPaise,
        // Exact stock counts are a business signal; the storefront only
        // needs to know whether it can be bought.
        inStock: v.availableQty > 0,
        lowStock: v.availableQty > 0 && v.availableQty <= v.lowStockThreshold,
      })),
    fromPricePaise: primary?.pricePaise ?? 0,
    fromMrpPaise: primary?.mrpPaise ?? 0,
  };
}
