import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { connectDB, disconnectDB } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PLACEHOLDER_FSSAI, Product } from '@/models/Product';

const configSchema = z.object({
  fssaiLicenceNo: z
    .string()
    .regex(/^\d{14}$/, 'FSSAI licence must be exactly 14 digits')
    .refine((v) => v !== PLACEHOLDER_FSSAI, 'FSSAI licence is still the placeholder'),
  manufacturerName: z.string().trim().min(1),
  manufacturerAddress: z.string().trim().optional(),
  countryOfOrigin: z.string().trim().min(1).default('India'),
  categories: z.record(
    z.string(),
    z.object({
      hsnCode: z.string().regex(/^\d{4,8}$/, 'HSN must be 4-8 digits'),
      gstRatePercent: z.number().min(0).max(28),
    }),
  ),
});

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const config = configSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), 'data/publish-compliance.json'), 'utf8')),
  );

  await connectDB();

  const drafts = await Product.find({ status: 'draft' }).populate('category', 'slug name');
  logger.info({ drafts: drafts.length, dryRun }, 'Draft products found');

  const failures: string[] = [];
  let published = 0;

  for (const product of drafts) {
    const category = product.category as unknown as { slug: string } | null;
    const rule = category ? config.categories[category.slug] : undefined;

    if (!rule) {
      failures.push(`${product.slug}: no HSN/GST mapping for category "${category?.slug ?? 'none'}"`);
      continue;
    }

    product.tax = { hsnCode: rule.hsnCode, gstRatePercent: rule.gstRatePercent };
    product.foodDisclosures = {
      ...product.foodDisclosures,
      fssaiLicenceNo: config.fssaiLicenceNo,
      manufacturerName: config.manufacturerName,
      manufacturerAddress: config.manufacturerAddress,
      countryOfOrigin: config.countryOfOrigin,
    };
    product.status = 'active';

    try {
      await product.validate();
      if (!dryRun) await product.save();
      published += 1;
    } catch (err) {
      failures.push(`${product.slug}: ${(err as Error).message}`);
    }
  }

  console.log(`\n  ${dryRun ? '[dry-run] would publish' : 'Published'}: ${published}/${drafts.length}`);
  if (failures.length > 0) {
    console.error('  Failed:');
    for (const f of failures) console.error(`   ✗ ${f}`);
    process.exitCode = 1;
  }

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Publish failed');
  await disconnectDB();
  process.exit(1);
});