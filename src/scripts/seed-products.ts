import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { connectDB, disconnectDB } from '@/lib/db';
import { Category, Product } from '@/models';
import { logger } from '@/lib/logger';

const rowSchema = z.object({
  sku: z.string().regex(/^[A-Z]{2}-[A-Z]{3}-\d{3}$/, 'SKU must look like AG-GRN-001'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(140),
  local_name: z.string().max(140).optional().or(z.literal('')),
  category: z.string().min(1),
  tag: z.string().max(40).optional().or(z.literal('')),
  pack_size: z.string().min(1).max(30),
  price_paise: z.coerce.number().int().nonnegative(),
  mrp_paise: z.coerce.number().int().nonnegative(),
  stock_qty: z.coerce.number().int().nonnegative(),
  status: z.enum(['draft', 'active', 'archived']),
  short_description: z.string().min(1).max(400),
});

type Row = z.infer<typeof rowSchema>;

function parseWeightGrams(packSize: string): number {
  const match = packSize.trim().match(/^([\d.]+)\s*(kg|g|gm|grams?)$/i);
  if (!match) {
    throw new Error(`Cannot parse pack size "${packSize}" — expected e.g. "1 KG" or "250 g"`);
  }
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const grams = unit === 'kg' ? value * 1000 : value;
  if (!Number.isInteger(grams) || grams <= 0) {
    throw new Error(`Pack size "${packSize}" resolves to a non-integer gram weight`);
  }
  return grams;
}

function imageForSlug(slug: string, name: string): IProductImageSeed[] {
  const publicPath = `/products/${slug}.webp`;
  if (!existsSync(resolve('public', 'products', `${slug}.webp`))) return [];
  return [{ url: publicPath, alt: `${name} — Avantika Grain Mills`, displayOrder: 0 }];
}

interface IProductImageSeed {
  url: string;
  alt: string;
  displayOrder: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? 'data/products-seed.csv');
  logger.info({ csvPath }, 'Reading catalogue CSV');

  const raw = readFileSync(csvPath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const errors: string[] = [];
  const rows: (Row & { weightGrams: number })[] = [];
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  records.forEach((record, index) => {
    const lineNo = index + 2;
    const parsed = rowSchema.safeParse(record);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`line ${lineNo}: ${issue.path.join('.')} — ${issue.message}`);
      }
      return;
    }

    const row = parsed.data;

    if (row.price_paise > row.mrp_paise) {
      errors.push(`line ${lineNo}: price (${row.price_paise}) exceeds MRP (${row.mrp_paise})`);
    }
    if (seenSkus.has(row.sku)) errors.push(`line ${lineNo}: duplicate SKU ${row.sku}`);
    if (seenSlugs.has(row.slug)) errors.push(`line ${lineNo}: duplicate slug ${row.slug}`);
    seenSkus.add(row.sku);
    seenSlugs.add(row.slug);

    try {
      rows.push({ ...row, weightGrams: parseWeightGrams(row.pack_size) });
    } catch (err) {
      errors.push(`line ${lineNo}: ${(err as Error).message}`);
    }
  });

  if (errors.length > 0) {
    logger.error({ count: errors.length }, 'CSV validation failed — nothing was imported');
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exitCode = 1;
    return;
  }

  logger.info({ rows: rows.length }, 'CSV validated');

  await connectDB();

  const categoryNames = [...new Set(rows.map((r) => r.category))];
  const categoryIdByName = new Map<string, unknown>();

  for (const [order, name] of categoryNames.entries()) {
    const doc = await Category.findOneAndUpdate(
      { slug: slugify(name) },
      { $setOnInsert: { name, slug: slugify(name), displayOrder: order, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryIdByName.set(name, doc._id);
  }
  logger.info({ categories: categoryNames.length }, 'Categories upserted');

  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await Product.findOne({ slug: row.slug });

    const variant = {
      sku: row.sku,
      packSize: row.pack_size,
      weightGrams: row.weightGrams,
      pricePaise: row.price_paise,
      mrpPaise: row.mrp_paise,
      stockQty: row.stock_qty,
      reservedQty: 0,
      availableQty: row.stock_qty,
      lowStockThreshold: 5,
      isActive: true,
    };

    if (existing) {
      existing.name = row.name;
      existing.localName = row.local_name || undefined;
      existing.tag = row.tag || undefined;
      existing.shortDescription = row.short_description;
      existing.category = categoryIdByName.get(row.category) as never;

      if (existing.images.length === 0) {
        existing.images = imageForSlug(row.slug, row.name) as never;
      }

      const variantIndex = existing.variants.findIndex((v) => v.sku === row.sku);
      if (variantIndex >= 0) {
        const current = existing.variants[variantIndex];
        current.packSize = variant.packSize;
        current.weightGrams = variant.weightGrams;
        current.pricePaise = variant.pricePaise;
        current.mrpPaise = variant.mrpPaise;
      } else {
        existing.variants.push(variant as never);
      }

      await existing.save();
      updated += 1;
    } else {
      await Product.create({
        name: row.name,
        localName: row.local_name || undefined,
        slug: row.slug,
        category: categoryIdByName.get(row.category),
        tag: row.tag || undefined,
        shortDescription: row.short_description,
        images: imageForSlug(row.slug, row.name),
        variants: [variant],

        status: 'draft',
        searchKeywords: [row.name, row.local_name].filter(Boolean) as string[],
      });
      inserted += 1;
    }
  }

  logger.info({ inserted, updated, total: rows.length }, 'Catalogue import complete');

  console.log(`
  Imported: ${inserted} new, ${updated} updated (${rows.length} rows)
  All products are in DRAFT. Before any can go live, obtain from the business:
    - FSSAI licence number (14 digits)
    - HSN code + GST rate per product (CA-confirmed)
    - Manufacturer name, address, country of origin
  `);

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Seed failed');
  await disconnectDB();
  process.exit(1);
});
