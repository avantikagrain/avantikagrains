# Avantika Grains — E-commerce Platform

Full-stack storefront for Avantika Grain Mills Pvt. Ltd. (Depalpur, Indore).

**Status: Milestones 2, 4 and 5 complete (backend). No storefront UI yet.**

Not production-ready, and not claimed to be. See *Blockers* and
*What is not tested* below before showing this to anyone as a working store.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Matches the existing live site; SSR/ISR for product-page SEO, which a Vite SPA cannot do well |
| Language | TypeScript, strict | — |
| Database | MongoDB Atlas + Mongoose 8 | Transactions require a replica set — Atlas provides one, standalone `mongod` does not |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Tokens live in `globals.css`, no `tailwind.config.js` |
| Auth | `jose` JWT in HTTP-only cookies + bcrypt (cost 12) | Edge-compatible; survives Next middleware |
| Validation | Zod 4 | Startup env validation + request schemas |
| Payments | Razorpay (sandbox) | Not wired yet — Milestone 5 |
| Shipping | Shiprocket | Not wired yet — Milestone 6 |

Resolved versions at install: Next 16.4.2, React 19.3.1, Mongoose 8.24.6,
Zod 4.6.7, Tailwind 4.3.3, jose 6.2.13.

---

## What is actually built

**Infrastructure**
- `src/lib/env.ts` — Zod-validated startup config. Refuses to boot in
  production with `STORAGE_PROVIDER=local`, no `ALLOWED_ORIGINS`, or
  `PAYMENTS_LIVE_MODE=true` alongside an `rzp_test_*` key.
- `src/lib/db.ts` — connection singleton (survives hot reload / lambda
  reuse), plus `withTransaction()` for cross-collection atomicity.
- `src/lib/money.ts` — integer-paise arithmetic. No float rupees are ever
  persisted or sent to a gateway.
- `src/lib/api-response.ts` — one JSON envelope, centralised error mapping,
  Zod/Mongoose/duplicate-key translation. Stack traces never reach a client.
- `src/lib/logger.ts` — pino with redaction for passwords, tokens, cookies,
  gateway secrets.
- `src/lib/auth/` — password hashing, JWT issue/verify, cookie session
  helpers, and the RBAC permission matrix.

**Data layer (`src/models/`)** — 13 models with validation, indexes and
business rules enforced at the schema level, not just in services:

- `Product` — refuses `status: 'active'` until FSSAI, HSN, GST rate,
  manufacturer and at least one image are present. Rejects price > MRP.
- `Order` — immutable line-item and price snapshots; totals must reconcile
  or the save fails; status transitions validated against an explicit state
  machine; COD can never be marked `paid`.
- `Payment` — a Razorpay payment cannot reach `captured` without
  `verifiedServerSide`. Refunds capped at the captured amount.
- `InventoryReservation` — TTL-backed stock holds (20 min) so a crashed
  checkout never strands stock. `InventoryMovement` is an append-only ledger.
- `WebhookEvent` — unique `(provider, providerEventId)`; the duplicate-
  delivery guard for both Razorpay and Shiprocket.
- `Shipment` — unique `idempotencyKey`, so a timeout-and-retry cannot create
  a second physical shipment.
- `AdminAuditLog` — immutable; records denied attempts as well as successes.
- `StoreSettings` — singleton; `missingForLaunch()` is the launch gate.

**Design tokens** — `src/app/globals.css`. Cream grounds, a single deep
forest accent, warm low-spread shadows, `prefers-reduced-motion` honoured
globally.

**Catalogue** — `data/products-seed.csv`, 31 products scraped from the live
site (Grains 8, Pulses 12, Seeds 8, Combo 3). Note: the master prompt says
30; the live catalogue has 31.

---

## Commerce core (Milestones 4 + 5)

**`src/services/pricing.ts`** — the only place an order total is decided.
Both the checkout preview and order creation call it, so the customer cannot
be shown one number and charged another. Prices are GST-inclusive (Indian
B2C convention), so tax is *extracted* from the price rather than added —
adding it would overcharge every customer by the GST rate.

**`src/services/inventory.ts`** — reserve → commit → release. Every step is a
single conditional `updateOne`; there is no read-check-write anywhere, since
that gap is exactly how an oversell happens. Two buyers racing for the last
unit: one update matches, the other matches nothing and is told it is out of
stock. Partial reservations roll back, so a failed checkout strands nothing.

**`src/services/orders.ts`** — prices, holds stock, writes the order, opens
the gateway order, in that order. A retry with the same `idempotencyKey`
returns the original order instead of creating a second one. If payment
setup fails, the order is cancelled and the stock released.

**`src/services/payments.ts`** — two independent confirmation paths (browser
handler and webhook), either order of arrival, both idempotent. A signature
only proves the payload is authentic, so the payment is also read back from
the gateway and the captured amount checked against the order total.

**COD** — accepted without a gateway round-trip, stock committed
immediately, `paymentStatus: 'cod_pending'`. The Order model makes
`paymentMethod: 'cod'` + `paymentStatus: 'paid'` unsaveable.

### Two real bugs fixed during this milestone

1. **Double-counted GST.** The Order model reconciled
   `total = subtotal - discount + shipping + tax + codFee`, but with
   inclusive pricing the tax is already inside `subtotal`. Every order would
   have been rejected, or — worse, had the check been looser — charged the
   GST twice. Order now carries `taxInclusive` and reconciles accordingly.
2. **Build-time font fetch.** `next/font/google` downloads fonts during
   `next build`, so a slow or unreachable fonts.googleapis.com breaks a
   production deploy. Typography now resolves to system stacks until the
   brand typeface is confirmed and self-hosted via `next/font/local`.

---

## Verified

All three were actually run:

```
npx tsc --noEmit     # clean
npx vitest run       # 51 passed (4 files)
npx next build       # compiled successfully, 5 API routes
```

The money suite caught a real rounding bug earlier
(`Math.round(1.005 * 100)` → 100, not 101); `rupeesToPaise` now normalises
through a fixed decimal representation first.

Razorpay signature tests use hardcoded reference HMACs, generated
independently rather than recomputed by the code under test — a test that
recomputes with the same helper only proves the function agrees with itself.

## What is NOT tested

This matters more than the passing count. The 51 tests cover **pure logic
only**: money arithmetic, tax extraction, discount allocation, signature
verification, the RBAC matrix, the order state machine, order numbers.

Untested, because there is no MongoDB in this environment:

- inventory reservation under concurrency (the oversell guard)
- order creation idempotency
- webhook duplicate handling
- the full checkout → pay → confirm path
- anything against the real Razorpay sandbox

**These are the highest-risk paths in the system.** Before launch they need
integration tests against a real Atlas dev cluster and a Razorpay test
account. A passing unit suite is not evidence that the oversell guard works
— only a concurrency test against a real replica set is.

No E2E, no Lighthouse, no load testing. There is no UI to measure yet.

---

## Blockers — needed from the business before launch

These are not optional polish. The first two are legal requirements.

1. **FSSAI licence number (14 digits)** — mandatory on the website and on
   every invoice for food sales in India. Absent from the current live site.
2. **GSTIN + HSN code and GST rate per product**, CA-confirmed. Branded
   packaged grains and loose grains are rated differently; this cannot be
   guessed.
3. **Evidence for the claims already on the live site** — "99.98% purity",
   "Non-GMO Certified", "Air Filtration Class 100". Reuse these only with
   lab reports or certificates in hand.
4. **Product photography** — approved image files with alt text.
5. **Razorpay merchant account** — test keys to begin, plus the webhook
   secret from the dashboard.
6. **Shiprocket account** — credentials and the pickup PIN code.
7. **Approved policy text** — privacy, shipping, returns, terms.
8. **Manufacturer / packer details** and country of origin per product.

Until 1, 2 and 8 arrive, products stay in `draft` — the `Product` model
enforces this, so the catalogue physically cannot go live half-configured.

---

## Setup

```bash
npm install
cp .env.example .env.local      # fill in MongoDB URI and JWT secrets
npm run seed:products -- data/products-seed.csv
npm run dev
```

Generate JWT secrets with `openssl rand -base64 48` — two different values.

The seed script validates all rows before writing anything; one bad row
aborts the whole import. Re-running is safe (upsert by SKU), and it never
overwrites `stockQty` — stock is owned by the inventory ledger.

---

## Remaining milestones

| # | Scope | Status |
|---|---|---|
| 1 | Reference audit, catalogue, design tokens | done |
| 2 | Repo, env validation, models, API architecture | done |
| 3 | Storefront UI, animations, catalogue pages | not started |
| 4 | Checkout, orders, inventory | backend done, untested against a DB |
| 5 | Razorpay + COD | backend done, untested against the sandbox |
| 6 | Shiprocket | not started |
| 7 | Admin dashboard | not started |
| 8 | SEO, analytics, a11y, performance, security testing | not started |
| 9 | Staging deploy, E2E, handover | not started |

Auth routes (register / login / refresh) are still outstanding from
Milestone 4 — the session and RBAC layers exist, the endpoints do not.

Realistic remaining effort: 3 weeks.

## Next, in order

1. Point `MONGODB_URI` at an Atlas dev cluster and write integration tests
   for reservation concurrency and order idempotency. Do this before more
   features — these are the paths that lose money when wrong.
2. Auth endpoints.
3. Storefront UI (Milestone 3).
4. Shiprocket (Milestone 6) — needs the account first.
5. Admin dashboard (Milestone 7).
