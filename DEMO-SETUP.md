# Demo Setup — client walkthrough

Gets a browsable, add-to-cart-able storefront running in about five minutes.

```bash
npm install
cp .env.example .env.local        # fill MONGODB_URI + the two JWT secrets
npm run seed:products -- data/products-seed.csv
npm run gen:images                # 31 brand-coloured placeholder images
npm run seed:demo                 # settings + HSN/GST + activates products
npm run seed:admin -- you@example.com 'a-long-demo-password'
npm run dev
```

For JWT secrets: `openssl rand -base64 48`, twice, different values.

Razorpay keys can stay as the `rzp_test_*` placeholders — the storefront,
catalogue and cart all work without them. Only the final payment step needs
a real test account.

---

## What is real vs what is a stand-in

This matters when the client asks "is this the actual site?"

**Real — taken from avantikagrains.com**
- All 31 products: names, local names, pack sizes, prices, MRPs, descriptions
- Category structure (Grains 8, Pulses 12, Seeds 8, Combo 3)
- Company name, registered address, PAN, IEC
- Brand direction: cream grounds, deep forest accent, editorial layout

**Real — researched, CA still to confirm**
- HSN headings: Chapter 10 cereals, 0713 pulses, Chapter 12 seeds
- GST 5% — loose pulses and grains are exempt, pre-packaged and labelled
  retail packs attract 5%. Avantika sells labelled 1 KG / 250 g packs.
- Items flagged for review: jowar vs bajra split, hemp seed classification,
  and all three combo packs (composite rate question)

**Stand-in — must be replaced before launch**
- FSSAI licence number: `00000000000000`
- GSTIN: deliberately left empty (a fabricated one fails checksum validation
  anywhere it is checked, so an empty field is the honest placeholder)
- Product imagery: 31 generated SVGs in `public/products/`
- Manufacturer phone, shelf life, storage text
- Shipping flat rate ₹50, free over ₹999, COD fee ₹30 — invented commercials
- Stock: 100 units per variant so checkout works

---

## The guards that stop stand-ins reaching production

These are not conventions, they are enforced in code:

1. `Product` refuses `status: 'active'` in production when the FSSAI value is
   the placeholder, or when any image is flagged `isPlaceholder`.
2. `StoreSettings.demoDataInUse` is `true` after `seed:demo`, and
   `missingForLaunch()` reports it as a blocker.
3. `seed:demo` refuses to run when `NODE_ENV=production`.
4. `env.ts` refuses to boot production with `STORAGE_PROVIDER=local`, no
   `ALLOWED_ORIGINS`, or `PAYMENTS_LIVE_MODE=true` beside a test key.

So the demo cannot quietly become the live site. Replacing the stand-ins is
a deliberate step, not something that gets forgotten.

---

## Walkthrough script for the client

1. **Homepage** — hero, category pills, 8 products, the five-stage process.
2. **Products** — all 31, filter by category, pagination.
3. **Product page** — gallery, pack size, quantity, statutory product
   information block (this is where FSSAI and manufacturer details go).
4. **Add to cart** → cart page, quantity edits, removal.
5. Point at the summary note: *"Shipping, taxes and discounts are calculated
   on the server at checkout."* That is the honest state — checkout UI is
   next.

**Do not claim** the site is live-ready, that payments work end to end, or
that the images are theirs. The backend for payments is built but has never
run against a real Razorpay sandbox.

---

## What to collect from the client at the demo

Bring this list to the meeting:

- FSSAI licence number + validity
- GSTIN
- CA sign-off on the HSN/GST table (`src/scripts/seed-demo.ts` has the draft)
- Product photography for 31 SKUs
- Logo files (SVG) and the brand typeface, with licence
- Shipping rate, free-shipping threshold, COD fee and limits
- Approved privacy / shipping / returns / terms text
- Razorpay account + webhook secret
- Shiprocket account + pickup PIN code
- Evidence for the "99.98% purity" and "Non-GMO Certified" claims
