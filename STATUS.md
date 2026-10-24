# Status — 22 Oct 2026

Your images are in and wired. Here is exactly what changed and what is left.

---

## Run this when you wake up

```powershell
npm install          # sharp was added
npm run seed:demo    # re-points the database at the new images
npm run dev
```

If products do not refresh, hard-reload with `Ctrl+Shift+R` — Next caches
optimised images aggressively.

---

## What I did with the images

**29 of 31 imported.** The zip had descriptive filenames
("Golden Wheat Grain Texture.png"), not slugs, so I wrote a mapper. Each
image was matched by keyword, resized to 1200 × 1500 (the 4:5 the grid
reserves) and encoded to WebP.

Size went from roughly 2.8 MB per PNG to 150–340 KB per WebP. Across 29
images that is about 80 MB down to 7 MB — the difference between a page
that loads and one that does not on a phone.

**Two are still missing:** `corn` and `rajma`. There was no corn or kidney
bean image in the zip. Both are running on a generated stand-in, and in a
grid of real photographs they are visibly different — rajma especially.
Generate those two and run:

```powershell
npm run import:images -- "C:\path\to\the\two\images"
npm run seed:demo
```

The mapper will pick them up by keyword ("corn", "kidney"), or you can just
name the files `corn.png` and `rajma.png`.

**No hero poster was in the zip** — it only contained `public/products/`.
I cut a hero from the wheat shot instead: `public/brand/hero.webp` at
2400 × 1030 for desktop and `hero-mobile.webp` at 1200 × 1600 for phones.
They are served through `<picture>`, so a phone never downloads the wide
crop. If you did mean to include a separate poster, drop it at those two
paths and it takes over with no code change.

---

## Design

Rebuilt to match avantikagrains.com rather than the light editorial
direction I had imposed earlier. That was my mistake — the brand already
had a direction and I should have followed it.

- Near-black ground, single gold accent, Playfair Display + Inter
- Logo lockup, uppercase letterspaced nav, "Let's talk", account + cart
- Centred wordmark hero over full-bleed photography
- Glass panels with frosted blur, lift-on-hover, gold edge wipe
- Five-stage process as a stepped panel with pills and dot controls
- Scroll reveals in native CSS (`animation-timeline: view()`), no JS

---

## A bug I introduced and fixed

While wiring the images I changed the generator to render at 1200 px wide
to match the supplied photos. The guard that stopped it overwriting real
photography worked by comparing width — so once both were 1200, the guard
matched everything and the generator overwrote all 29 of your images.

Caught it, restored from the source zip, and replaced the width check with
an explicit manifest (`public/products/.generated.json`) that records what
the script produced. Verified afterwards that a generator run regenerates
only `corn` and `rajma` and leaves the other 29 byte-identical.

Worth knowing because it is the kind of thing that would otherwise have
silently destroyed your images on a later run.

---

## Production guards — read this before deploying

Two separate guards now, because they are different kinds of problem.

**FSSAI — hard block, no override.** A product cannot go `active` in
production while the FSSAI licence is the placeholder `00000000000000`.
A fake licence number on a live food listing is a legal
misrepresentation, so there is deliberately no way around this in code.

**Imagery — explicit opt-in.** Products carrying stand-in imagery also
refuse to publish, but this one can be overridden with
`ALLOW_PLACEHOLDER_IMAGES=true`. Only `corn` and `rajma` are flagged; the
29 you supplied are treated as real.

That split means a deploy fails loudly rather than quietly shipping either
problem, but you can still make the imagery call yourself.

One honest note for the client conversation: the supplied images are
AI-generated, not photographs of Avantika's actual product. They look
right and they are consistent, which is more than most stock achieves. But
if a customer compares the packet to the site, it is not the same grain.
That is the client's call to make knowingly, not something to discover
later.

---

## Verified

Actually run, not assumed:

```
npx tsc --noEmit     clean
npx vitest run       51 passed
npx next build       compiled, 30 routes
```

Rendered and inspected: hero at 1440 and 390, product grid at both widths,
bulk enquiry page. Zero horizontal overflow at 390 px.

**Not verified:** anything that needs MongoDB. There is no mongod in my
environment, so `/`, `/products` and `/products/[slug]` were checked
through a static harness using the real built CSS and real images, not
against the running app. They should be correct, but check them on your
machine first thing.

---

## Still outstanding

**Blocked on the business, not on code:**
- FSSAI licence number — the single hardest launch blocker
- GSTIN
- CA sign-off on the HSN/GST table in `src/scripts/seed-demo.ts`
- Razorpay account and webhook secret
- Shiprocket account and pickup PIN code
- Shipping rate, free-shipping threshold, COD fee and limits
- Approved privacy / shipping / returns / terms text
- Support phone number
- Logo files — the header currently draws a wheat mark I wrote in SVG

**Development:**
- Integration tests against a real MongoDB. The oversell guard, order
  idempotency and webhook deduplication have still never run against a
  database. Highest-risk gap in the project.
- Checkout stops before payment — address entry and the Razorpay handoff
  are the next build.
- Admin dashboard. The client will ask where they see orders and
  enquiries, and right now the answer is Compass.
- Shiprocket.
- Order confirmation email.
- `sweep:reservations` needs a cron entry every 5 minutes, or expired
  stock holds get deleted by TTL without the stock returning.

`PENDING.md` has the full list.
