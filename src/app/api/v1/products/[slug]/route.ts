import { ok, route } from '@/lib/api-response';
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { notFound } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    await connectDB();
    const { slug } = await context.params;

    const product = await Product.findOne({ slug, status: 'active' })
      .populate('category', 'name slug')
      .populate('relatedProducts', 'name slug images variants')
      .lean();

    if (!product) throw notFound('Product not found');

    const category = product.category as unknown as { name: string; slug: string } | null;

    return ok({
      slug: product.slug,
      name: product.name,
      localName: product.localName,
      tag: product.tag,
      shortDescription: product.shortDescription,
      longDescription: product.longDescription,
      images: product.images.map((i) => ({
        url: i.url,
        alt: i.alt,
        width: i.width,
        height: i.height,
      })),
      category: category ? { name: category.name, slug: category.slug } : null,
      variants: product.variants
        .filter((v) => v.isActive)
        .map((v) => ({
          id: v._id.toString(),
          sku: v.sku,
          packSize: v.packSize,
          weightGrams: v.weightGrams,
          pricePaise: v.pricePaise,
          mrpPaise: v.mrpPaise,
          inStock: v.availableQty > 0,
          lowStock: v.availableQty > 0 && v.availableQty <= v.lowStockThreshold,
        })),
      specifications: product.specifications,
      // Statutory disclosures are shown on the product page because food
      // labelling rules require them to be visible before purchase.
      foodDisclosures: {
        manufacturerName: product.foodDisclosures?.manufacturerName,
        manufacturerAddress: product.foodDisclosures?.manufacturerAddress,
        countryOfOrigin: product.foodDisclosures?.countryOfOrigin,
        shelfLifeDays: product.foodDisclosures?.shelfLifeDays,
        isVegetarian: product.foodDisclosures?.isVegetarian,
        storageInstructions: product.foodDisclosures?.storageInstructions,
        fssaiLicenceNo: product.foodDisclosures?.fssaiLicenceNo,
      },
      seo: product.seo,
    });
  },
);
