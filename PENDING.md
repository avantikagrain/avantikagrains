# Avantika Grains — what works, what doesn't

Last audited: 22 Oct 2026, against the actual repo.

Legend: `[x]` done and verified · `[~]` partial · `[ ]` not started

---

## 1. PROBLEMS — honest list

### Blocking a client demo

- [x] **All 31 product photographs are in.** `public/products/.generated.json`
      is now empty — not one generated stand-in is left. Corn was the last,
      and its real photo landed on 22 Oct.
- [x] **Typefaces are self-hosted.** Playfair Display and Inter now load as
      six .woff2 files from `public/fonts` (148 KB total), not from
      fonts.googleapis.com. No third-party request, no CSP exception, and
      the typography survives networks where Google Fonts is blocked.
      `npm run fonts:sync` re-copies them from the @fontsource packages.
      If the client has a brand font, swap the `@font-face` blocks at the
      top of `globals.css` and the two `--font-*` tokens.
- [ ] **No logo file.** The wordmark is set in the display serif, and the
      browser-tab icon (`src/app/icon.svg`) is an original wheat-ear mark
      drawn as a stand-in. Real logo files change the header, footer and
      that icon.
- [ ] **Mobile hero crops.** The three supplied banners are 2000×750 desktop
      artwork; at 390px their baked-in headline is unreadable, so the hero
      crops to the photography and the HTML heading below carries the
      message. A 4:5 re-cut of each banner would be better.

### Blocking launch (not development — these come from the business)

- [ ] **FSSAI licence number** (14 digits). Legally mandatory on a food
      retailer's site and on every invoice. Currently the placeholder
      `00000000000000`, which the Product model refuses to publish in
      production.
- [ ] **GSTIN.** Deliberately left empty — a fabricated one fails checksum
      validation anywhere it is checked.
- [ ] **HSN + GST rate per product, CA-confirmed.** Draft table is in
      `src/scripts/seed-demo.ts` with three items flagged for review:
      jowar/bajra split, hemp seeds, and all three combo packs.
- [ ] **Evidence for the claims already on the live site** — "99.98% purity",
      "Non-GMO Certified", "Air Filtration Class 100". The site now presents
      these as the mill's own measured standard rather than certification,
      which is defensible, but lab reports should back them.
- [ ] **Razorpay account** — test keys and webhook secret.
- [ ] **Shiprocket account** — credentials and pickup PIN code.
- [ ] **Commercial rules** — shipping rate, free-shipping threshold, COD fee
      and limits. Currently invented demo values.
- [ ] **Approved policy text.** The policy pages accurately describe how the
      system behaves but contain no legal wording: no governing law,
      jurisdiction, liability limits, grievance officer or claim windows.
- [ ] **Support phone number** for the footer and order emails.

### Known technical gaps

- [ ] **No integration tests.** The 51 passing tests cover pure logic only.
      The oversell guard, order idempotency and webhook deduplication have
      never run against a real MongoDB. These are the highest-risk paths in
      the system and a passing unit suite is not evidence they work.
- [ ] **Local MongoDB cannot do transactions** (needs a replica set). Nothing
      in the current path uses them, but making order creation fully atomic
      will require Atlas or a local replica set.
- [ ] **No rate limiting at the edge.** Bulk enquiries are limited per phone
      number in the handler; nothing else is limited.
- [ ] **CSRF protection not implemented.** The cookie name is reserved.
- [ ] **CORS not enforced.** `ALLOWED_ORIGINS` is validated but unused.
- [ ] **Audit log is never written to.** The model and indexes exist.
- [ ] **No scheduled job runs `sweep:reservations`.** It must run every ~5
      minutes or expired stock holds are deleted by TTL without the stock
      being returned.
- [ ] **No email.** Order confirmations and enquiry notifications are not
      sent. Records are stored, so nothing is lost.
- [ ] **Hero image is a catalogue image reused.** Fine for now; swap for a
      dedicated shot.

---

## 2. What is built and verified

Verified by actually running: `tsc --noEmit` clean, `vitest run` 51/51,
`next build` succeeds, 29 routes, zero horizontal overflow at 390px.

### Storefront
- [x] Homepage — full-bleed hero with image, scrim, stats bar; catalogue
      register; product grid; five-stage process; closing statement
- [x] `/products` — category filter, pagination, product count
- [x] `/products/[slug]` — gallery, variants, quantity, statutory product
      information, image attribution
- [x] `/cart`, `/checkout` (server-priced quote; payment step inert)
- [x] `/about`, `/manufacturing`, `/quality`, `/contact`
- [x] `/bulk-orders` — full enquiry form
- [x] Four policy pages
- [x] Loading skeletons on `/`, `/products`, `/products/[slug]`
- [x] Mobile nav, responsive at 320–1440px

### Backend
- [x] 14 Mongoose models with business rules enforced at schema level
- [x] Server-side pricing — inclusive GST extraction, proportional discount
      allocation, COD rules
- [x] Atomic inventory reserve/commit/release, no read-then-write anywhere
- [x] Order creation with idempotency and rollback
- [x] Razorpay: gateway order, checkout signature verification with gateway
      read-back, raw-body webhook verification, idempotency ledger
- [x] COD flow with a model-level guard against marking it paid
- [x] Auth: register, login, logout, refresh with token-family rotation,
      login throttling
- [x] Public catalogue API
- [x] Bulk enquiry API with honeypot and per-phone rate limiting

---

## 3. Remaining milestones

| # | Scope | Status |
|---|---|---|
| 3 | Storefront UI | done for the pages that exist |
| 4 | Auth, cart, checkout, orders, inventory | backend done; checkout UI stops before payment |
| 5 | Razorpay + COD | backend done, never run against the sandbox |
| 6 | Shiprocket | not started — needs the account |
| 7 | Admin dashboard | not started |
| 8 | SEO, analytics, a11y, performance | metadata and sitemap partial; no analytics |
| 9 | Deployment | not started |

Still outstanding from earlier milestones: cart persistence to the server
(currently browser-only), address CRUD, order detail and tracking pages,
password reset, refund and reconciliation endpoints.

---

## 4. Order to work in

1. Replace images — Unsplash now, mill photography before launch.
2. Chase the business inputs in section 1. Longest lead time, zero
   development dependency.
3. Integration tests against a real MongoDB, before more features.
4. Finish checkout: address entry, Razorpay handoff, order confirmation.
5. Admin dashboard — the client needs somewhere to see orders and enquiries.
6. Shiprocket.
7. SEO, analytics, performance, then deploy.

---

## Changelog — 22 Oct 2026

Fixed in this pass:

- **Homepage order.** Products now sit directly under the hero, Shopify
  style — twelve of them, three rows, with the category pills and the page's
  `h1` merged into the section header. The trust strip and the milling story
  moved below the shelf. Measured: at 1440×1000 the first product row starts
  at 846px and at 390×844 it starts at 667px, both inside the fold.
- **`/account/orders` did not exist.** Signing in or registering redirected
  there, so every successful sign-in landed on a 404. The page is now built:
  session-gated, scoped to the signed-in user at the query, with an empty
  state, a status vocabulary written for customers rather than the database,
  and a sign-out that revokes the token server-side.
- **No favicon.** Every visitor's first page load 404'd on `/favicon.ico` and
  the tab showed a blank icon. Added `src/app/icon.svg`.
- **No error or 404 page.** An unhandled render error or a mistyped product
  URL showed Next's own unstyled default. Both are now branded; the error
  page shows the server-side digest so support can match it to a log line.
- **Refunds issued from the Razorpay dashboard were never recorded.** The
  `refund.processed` webhook looked for a matching local refund and only
  logged a warning when there wasn't one — which is exactly the case when
  someone refunds a customer by hand from Razorpay. The money had moved but
  `amountRefundedPaise` stayed at zero, so a fully refunded order read as
  *partially refunded* for ever and the refund was absent from the books.
  The webhook is signature-verified and therefore authoritative, so it now
  records the refund with `source: 'gateway'`. A webhook carrying an
  unusable amount is logged at error level and left for manual
  reconciliation rather than guessed at.
- **Hero carousel pause was self-cancelling.** Hover, tab-visibility and
  reduced-motion all wrote to one `paused` flag, so switching tabs and back
  resumed the carousel under the pointer. They are three derived signals now.
  Reduced-motion is also subscribed rather than read once, so turning the
  setting on mid-session stops it immediately.
- **Checkout quote flickered.** An aborted quote request cleared the loading
  flag in a `finally`, showing a stale total as "ready" while the newer
  quote was still in flight.
- **Cart rewritten onto `useSyncExternalStore`.** No extra render on mount,
  writes happen in the mutation rather than an effect watching the value,
  and a `storage` listener keeps two open tabs in step.
- **Linting never ran.** `npm run lint` called `next lint`, which Next 16
  removed, and there was no ESLint config at all. Added a flat config on
  `core-web-vitals`; the repo is clean against it. Every bug in this list
  from the carousel down was found by turning it on.
- Cart aria-label read "Cart, 1 items".
- Header account icon points at `/account/orders` rather than the sign-in
  form, so a signed-in customer skips a step.

Verified by running it, not by reading it: production build, every route
smoke-tested for status, screenshots at 1440 and 390, every reveal animation
confirmed visible once scrolled into view, all twelve product images
confirmed decoded on mobile, and the cart driven in a real browser through
add → badge → reload → cart page.

Still not verified against a real MongoDB — see section 3. The oversell
guard, order idempotency and webhook dedup remain the highest-risk untested
paths.

### Images — 22 Oct, second pass

All 34 supplied PNGs were run through `npm run import:images`. Thirty-one
matched a product (corn included, which was the last stand-in), were resized
to 1200×1500 and encoded to WebP. The three that did not match are the hero
banners, which are already in `public/brand/` — they are 2048×768, the same
2.67:1 desktop artwork, so the mobile-crop gap above still stands.

**Why the new photos did not appear at first, and what was changed.** Next
caches every resized variant under `.next/cache/images`, keyed by the source
URL plus width and quality — never by the file's contents. Replacing a photo
keeps its filename, so every cache key still matches and the optimiser goes
on serving the old picture. It survives `next build` and a PM2 restart, so on
the VPS a new photo can sit on disk for days while customers are shown the
previous one. `import:images` now clears that directory itself after a
successful import.

**On the server, after replacing any image:** run `npm run import:images`
(which clears the cache), then `npm run seed:demo`, then restart. If an image
is ever replaced by hand rather than through the importer, delete
`.next/cache/images` before restarting.

`seed-demo` no longer carries a hand-kept list of which products are still on
stand-ins; it reads `public/products/.generated.json`, which the image tools
maintain. A hard-coded list drifts the moment someone drops a photo in
without editing the script.
