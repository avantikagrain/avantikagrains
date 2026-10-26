import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Category, Product, StoreSettings } from '@/models';
import { PLACEHOLDER_FSSAI } from '@/models/Product';

// DEV ONLY: fills stand-in compliance data so the storefront can be shown.
// Never run against a production database.
const DEMO_STOCK = 100;
const DEMO_HSN: Record<string, string> = {
  grains: '1008',
  pulses: '0713',
  seeds: '1207',
  'combo-packs': '2106',
};

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('seed:demo refuses to run with NODE_ENV=production.');
    process.exitCode = 1;
    return;
  }

  await connectDB();
  void Category; // registers the model for populate()

  const imagesPath = Product.schema.path('images') as unknown as {
    schema?: { path(name: string): unknown };
  };
  const hasPlaceholderFlag = Boolean(imagesPath.schema?.path('isPlaceholder'));

  // Archive (non-destructively) the test rows created earlier.
  await Product.updateMany({ slug: /^example-/ }, { $set: { status: 'archived' } });

  const drafts = await Product.find({
    status: 'draft',
    slug: { $not: /^example-/ },
  }).populate('category', 'slug');

  const failures: string[] = [];
  let published = 0;

  for (const product of drafts) {
    const categorySlug = (product.category as unknown as { slug: string } | null)?.slug ?? '';

    product.tax = { hsnCode: DEMO_HSN[categorySlug] ?? '1008', gstRatePercent: 0 };
    product.set('foodDisclosures.fssaiLicenceNo', PLACEHOLDER_FSSAI);
    product.set('foodDisclosures.manufacturerName', 'Avantika Grain Mills Pvt. Ltd.');
    product.set('foodDisclosures.manufacturerAddress', 'Depalpur, Indore, Madhya Pradesh 453115');
    product.set('foodDisclosures.countryOfOrigin', 'India');
    product.set('foodDisclosures.isVegetarian', true);

    if (product.images.length === 0 && existsSync(resolve('public', 'products', `${product.slug}.webp`))) {
      product.images = [
        {
          url: `/products/${product.slug}.webp`,
          alt: `${product.name} — Avantika Grain Mills`,
          displayOrder: 0,
          ...(hasPlaceholderFlag ? { isPlaceholder: true } : {}),
        },
      ] as never;
    }

    for (const variant of product.variants) {
      if (variant.stockQty === 0) {
        variant.stockQty = DEMO_STOCK;
        variant.availableQty = DEMO_STOCK - variant.reservedQty;
      }
    }

    product.status = 'active';

    try {
      await product.save();
      published += 1;
    } catch (err) {
      failures.push(`${product.slug}: ${(err as Error).message}`);
    }
  }

  if (published > 0) {
    await StoreSettings.updateOne(
      { key: 'default' },
      { $set: { demoDataInUse: true } },
      { upsert: true },
    );
  }

  logger.info({ published, drafts: drafts.length }, 'Demo publish complete');
  console.log(`\n  Published (demo data): ${published}/${drafts.length}`);
  if (failures.length > 0) {
    console.error('  Failed:');
    for (const f of failures) console.error(`   ✗ ${f}`);
    process.exitCode = 1;
  }

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Demo seed failed');
  await disconnectDB();
  process.exit(1);
});