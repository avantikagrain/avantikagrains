/**
 * Demo seeding — makes the storefront fully operable for a client walkthrough.
 *
 *   npm run seed:demo
 *
 * Fills every field the Product model requires for publication, attaches the
 * generated placeholder imagery, and flips all 31 products to `active` so
 * the catalogue, cart and checkout actually work.
 *
 * WHAT IS REAL vs WHAT IS A STAND-IN
 *
 *   Real, researched:   HSN headings and the 5% GST slab for pre-packaged
 *                       and labelled grains/pulses/seeds. Still requires the
 *                       client's CA to confirm 8-digit codes and the combo
 *                       pack treatment before invoicing.
 *
 *   Stand-in:           FSSAI licence number (fourteen zeros — structurally
 *                       valid, obviously not genuine), manufacturer details,
 *                       shelf life, storage text, shipping/COD commercials,
 *                       product imagery.
 *
 * Everything marked stand-in is blocked in production: the Product model
 * refuses to publish on a placeholder FSSAI or placeholder image, and the
 * StoreSettings record carries `demoDataInUse: true`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '@/lib/db';
import { Product, StoreSettings } from '@/models';
import { PLACEHOLDER_FSSAI } from '@/models/Product';
import { logger } from '@/lib/logger';

if (process.env.NODE_ENV === 'production') {
  console.error('seed:demo must never be run against production.');
  process.exit(1);
}

/**
 * HSN headings by product slug.
 *
 * Four-digit headings only — these are defensible from the tariff schedule.
 * Eight-digit sub-classification depends on variety and processing and is a
 * judgement the client's CA has to make.
 *
 * GST: loose/unlabelled grains and pulses are exempt; pre-packaged and
 * labelled retail packs attract 5%. Avantika sells labelled 1 KG / 250 g
 * retail packs, so 5% is the applicable slab.
 */
const HSN_BY_SLUG: Record<string, { hsn: string; note?: string }> = {
  // Chapter 10 — cereals
  'emmer-wheat': { hsn: '1001' },
  barley: { hsn: '1003' },
  oats: { hsn: '1004' },
  corn: { hsn: '1005' },
  'brown-rice': { hsn: '1006' },
  millet: { hsn: '1008', note: 'Jowar falls under 1007, bajra under 1008 — split if sold separately' },
  quinoa: { hsn: '1008' },
  amaranth: { hsn: '1008' },

  // Chapter 07 — dried leguminous vegetables
  'toor-dal': { hsn: '0713' },
  'moong-dal': { hsn: '0713' },
  'masoor-dal': { hsn: '0713' },
  'chana-dal': { hsn: '0713' },
  'urad-dal': { hsn: '0713' },
  'whole-green-moong': { hsn: '0713' },
  'whole-black-urad': { hsn: '0713' },
  'kabuli-chana': { hsn: '0713' },
  'kala-chana': { hsn: '0713' },
  rajma: { hsn: '0713' },
  lobia: { hsn: '0713' },
  matar: { hsn: '0713' },

  // Chapter 12 — oil seeds and oleaginous fruits
  'flax-seeds': { hsn: '1204' },
  'sunflower-seeds': { hsn: '1206' },
  'sesame-seeds': { hsn: '1207' },
  'pumpkin-seeds': { hsn: '1207' },
  'watermelon-seeds': { hsn: '1207' },
  'chia-seeds': { hsn: '1207' },
  'basil-seeds': { hsn: '1207' },
  'hemp-seeds': { hsn: '1207', note: 'Hemp seed classification is contested — CA must confirm' },

  // Mixed combos
  'combo-pulses': { hsn: '0713', note: 'Mixed pack — CA must confirm whether a composite rate applies' },
  'combo-grains': { hsn: '1008', note: 'Mixed pack — CA must confirm whether a composite rate applies' },
  'combo-seeds': { hsn: '1207', note: 'Mixed pack — CA must confirm whether a composite rate applies' },
};

const GST_RATE_PREPACKAGED = 5;

/**
 * Products still running on a generated stand-in rather than supplied
 * photography. These stay flagged `isPlaceholder`, so the production
 * publish guard fires for them specifically rather than for the whole
 * catalogue.
 *
 * Read from the manifest the image tooling maintains rather than hand-kept
 * here: `gen:images` adds a slug when it writes a stand-in and
 * `import:images` removes it when a real photo replaces one. A hard-coded
 * list drifts the moment someone drops a photo in without editing this
 * file — which is exactly the mistake that would ship a vector drawing to
 * a customer, or block a launch over a product that was fixed weeks ago.
 */
function awaitingPhotography(): Set<string> {
  try {
    const raw = readFileSync(resolve('public/products/.generated.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []);
  } catch {
    // No manifest means nothing was ever generated — every image on disk
    // was supplied. Treating that as "all placeholders" would block the
    // publish guard on a catalogue that is actually ready.
    return new Set();
  }
}

const AWAITING_PHOTOGRAPHY = awaitingPhotography();

const DEMO_DISCLOSURES = {
  fssaiLicenceNo: PLACEHOLDER_FSSAI,
  manufacturerName: 'Avantika Grain Mills Private Limited',
  manufacturerAddress:
    'Gram Navda Dhar Road, Navdapanth, Kalaria, Depalpur, Indore, Madhya Pradesh 453001',
  countryOfOrigin: 'India',
  shelfLifeDays: 180,
  isVegetarian: true,
  storageInstructions: 'Store in a cool, dry place away from direct sunlight.',
};

async function seedSettings() {
  const existing = await StoreSettings.findOne({ key: 'default' });
  if (existing?.demoDataInUse === false) {
    console.log('  Store settings already hold real data — leaving them alone.');
    return;
  }

  await StoreSettings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      demoDataInUse: true,
      business: {
        legalName: 'Avantika Grain Mills Private Limited',
        tradeName: 'Avantika Grains',
        registeredAddress: DEMO_DISCLOSURES.manufacturerAddress,
        pan: 'ABFCA7783D',
        iec: 'ABFCA7783D',
        fssaiLicenceNo: PLACEHOLDER_FSSAI,
        supportEmail: 'avantikagrain@gmail.com',
        supportPhone: '0000000000',
        // gstin deliberately left empty — a fabricated GSTIN would fail
        // checksum validation anywhere it is checked.
      },
      tax: {
        pricesIncludeTax: true,
        originStateCode: '23', // Madhya Pradesh
        shippingHsnCode: '9965',
        shippingGstRatePercent: 5,
        discountReducesTaxableValue: true,
      },
      shipping: {
        flatRatePaise: 5000,
        freeShippingThresholdPaise: 99900,
        pickupPincode: '453001',
        defaultPackageWeightGrams: 120,
        maxOrderWeightGrams: 30000,
      },
      cod: {
        enabled: true,
        feePaise: 3000,
        minOrderPaise: 19900,
        maxOrderPaise: 1000000,
        blockedPincodes: [],
      },
      payments: { razorpayLiveMode: false },
      invoicing: { seriesPrefix: 'AG', nextSequence: 1, financialYear: '2026-27' },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log('  Store settings seeded (demo values).');
}

async function seedProducts() {
  const products = await Product.find({});
  if (products.length === 0) {
    console.error('  No products found. Run `npm run seed:products` first.');
    process.exitCode = 1;
    return;
  }

  let activated = 0;
  const unmapped: string[] = [];

  for (const product of products) {
    const mapping = HSN_BY_SLUG[product.slug];
    if (!mapping) {
      unmapped.push(product.slug);
      continue;
    }

    product.tax = { hsnCode: mapping.hsn, gstRatePercent: GST_RATE_PREPACKAGED };
    product.foodDisclosures = { ...DEMO_DISCLOSURES };

    // Re-point at generated imagery unless real photography has replaced it.
    if (product.images.length === 0 || product.images[0]?.isPlaceholder) {
      product.images = [
        {
          url: `/products/${product.slug}.webp`,
          alt: `${product.name}${product.localName ? ` (${product.localName})` : ''} — Avantika Grains`,
          width: 1200,
          height: 1500,
          displayOrder: 0,
          isPlaceholder: AWAITING_PHOTOGRAPHY.has(product.slug),
        },
      ];
    }

    if (!product.seo?.title) {
      product.seo = {
        title: `${product.name} — Avantika Grains`.slice(0, 70),
        description: product.shortDescription.slice(0, 160),
      };
    }

    // Give the demo some sellable stock so cart and checkout work.
    for (const variant of product.variants) {
      if (variant.stockQty === 0) {
        variant.stockQty = 100;
        variant.availableQty = 100 - variant.reservedQty;
      }
    }

    product.status = 'active';
    await product.save();
    activated += 1;
  }

  console.log(`  ${activated} products activated with demo compliance data.`);
  if (unmapped.length > 0) {
    console.warn(`  No HSN mapping for: ${unmapped.join(', ')}`);
  }

  const notes = Object.entries(HSN_BY_SLUG).filter(([, v]) => v.note);
  if (notes.length > 0) {
    console.log('\n  HSN items the CA must review:');
    for (const [slug, { hsn, note }] of notes) {
      console.log(`    - ${slug} (${hsn}): ${note}`);
    }
  }
}

async function main() {
  await connectDB();
  console.log('\nSeeding demo data...\n');

  await seedSettings();
  await seedProducts();

  console.log(`
  DEMO DATA IS IN USE.

  Stand-in values that must be replaced before launch:
    - FSSAI licence number (currently ${PLACEHOLDER_FSSAI})
    - GSTIN (left empty — a fabricated one fails checksum validation)
    - Manufacturer contact phone
    - Shelf life and storage text per product
    - Product imagery for: ${[...AWAITING_PHOTOGRAPHY].join(', ')}
      (the other 29 use the images supplied by the business)
    - Shipping rate, free-shipping threshold, COD fee and limits

  Production boot and product publication are blocked while these remain.
`);

  await disconnectDB();
}

main().catch(async (err) => {
  logger.error({ err }, 'Demo seed failed');
  await disconnectDB();
  process.exit(1);
});
