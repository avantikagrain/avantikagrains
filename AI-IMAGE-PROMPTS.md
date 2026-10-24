# Generating the 31 product images with ChatGPT

ChatGPT makes one image per request — there is no way to fire off 31 at
once. What works is locking the style first, then walking the list with a
one-word reply each time.

Expect about 45 minutes for all 31.

---

## Step 1 — paste this once, at the start of a fresh chat

> You are my product photographer for a premium Indian grain brand. I will
> send you product names one at a time. For each one, generate exactly one
> photograph.
>
> **Fixed style for every image in this series — never vary it:**
>
> - Overhead flat-lay, camera directly above, 90° top-down
> - The ingredient fills the entire frame edge to edge, loose and
>   uncontained — no bowl, no jar, no sack, no packaging, no scoop, no hands
> - Portrait orientation, 4:5
> - Single soft light source from the upper left, gentle falloff to the
>   lower right, soft natural shadows between the grains
> - Shallow depth: the surface is slightly mounded, not perfectly flat
> - Dark, warm, matte stone surface barely visible only where the
>   ingredient thins at the very edges
> - Colour grade: warm, rich, slightly desaturated, deep shadows — editorial
>   food photography, not bright supermarket lighting
> - Macro detail: individual grains clearly sharp in the centre third
> - Absolutely no text, labels, logos, watermarks, packaging, props,
>   garnishes, cutlery, cloth, or wooden boards
>
> Reply "ready" and wait. When I send a product name, output only the image.

Wait for "ready".

---

## Step 2 — send these one at a time

After each image downloads, send the next line. If ChatGPT starts drifting
(brighter, different angle, a bowl creeping in), paste this correction:

> Keep the locked style: top-down, frame-filled, loose grain, upper-left
> soft light, dark warm surface, no props. Regenerate.

### Grains — 8

| # | Send this | Save as |
|---|---|---|
| 1 | Emmer wheat berries (khapli), whole unmilled, pale golden-brown | `emmer-wheat.webp` |
| 2 | White quinoa seeds, tiny pale discs with visible germ rings | `quinoa.webp` |
| 3 | Amaranth (rajgira) seeds, very fine pale ivory grains | `amaranth.webp` |
| 4 | Pearl barley (jau), plump cream-coloured grains | `barley.webp` |
| 5 | Dried yellow corn kernels (makka), deep golden | `corn.webp` |
| 6 | Pearl millet (bajra), small round grey-green grains | `millet.webp` |
| 7 | Rolled oats, pale flat flakes | `oats.webp` |
| 8 | Brown rice grains with intact bran, warm tan | `brown-rice.webp` |

### Pulses — 12

| # | Send this | Save as |
|---|---|---|
| 9 | Toor dal (split pigeon peas), matte golden-yellow split lentils | `toor-dal.webp` |
| 10 | Yellow moong dal, small bright yellow split lentils | `moong-dal.webp` |
| 11 | Red masoor dal, vivid orange-red split lentils | `masoor-dal.webp` |
| 12 | Chana dal (split bengal gram), chunky golden split lentils | `chana-dal.webp` |
| 13 | Urad dal (split black gram), ivory-white split lentils with dark flecks | `urad-dal.webp` |
| 14 | Whole green moong beans, small glossy dark-green beans | `whole-green-moong.webp` |
| 15 | Whole black urad beans, small matte black beans | `whole-black-urad.webp` |
| 16 | Kabuli chana (white chickpeas), large pale beige chickpeas | `kabuli-chana.webp` |
| 17 | Kala chana (black chickpeas), small dark brown chickpeas | `kala-chana.webp` |
| 18 | Rajma (red kidney beans), deep red glossy beans | `rajma.webp` |
| 19 | Lobia (black-eyed peas), cream beans each with a black eye | `lobia.webp` |
| 20 | Dried whole green peas (matar), wrinkled dusty-green peas | `matar.webp` |

### Seeds — 8

| # | Send this | Save as |
|---|---|---|
| 21 | Shelled pumpkin seeds, flat olive-green seeds | `pumpkin-seeds.webp` |
| 22 | Chia seeds, tiny speckled grey-black ovals | `chia-seeds.webp` |
| 23 | Shelled sunflower seeds, pale grey-green teardrops | `sunflower-seeds.webp` |
| 24 | Brown flax seeds (alsi), glossy flat amber-brown seeds | `flax-seeds.webp` |
| 25 | White sesame seeds (til), tiny pale ivory teardrops | `sesame-seeds.webp` |
| 26 | Basil seeds (sabja), tiny matte black seeds | `basil-seeds.webp` |
| 27 | Shelled watermelon seeds, pale cream flat seeds | `watermelon-seeds.webp` |
| 28 | Hulled hemp seeds, soft pale green-cream hearts | `hemp-seeds.webp` |

### Combo packs — 3

These three break the "single ingredient" rule on purpose. Send this line
first:

> For the next three, show several ingredients arranged in distinct
> adjacent sections within the same frame — still top-down, still
> frame-filling, same lighting, no dividers or containers.

| # | Send this | Save as |
|---|---|---|
| 29 | Five different Indian lentils in adjacent bands — toor, moong, masoor, chana, urad | `combo-pulses.webp` |
| 30 | Five different whole grains in adjacent bands — wheat, barley, millet, quinoa, brown rice | `combo-grains.webp` |
| 31 | Five different seeds in adjacent bands — pumpkin, sunflower, flax, sesame, chia | `combo-seeds.webp` |

---

## Step 3 — save and install

1. Download each image as you go. Rename it to the filename in the table.
2. Put all 31 into `public/products/`, replacing what is there.
3. If ChatGPT gives you `.png` or `.jpg`, that is fine — rename the
   extension in the table to match (e.g. `emmer-wheat.jpg`), then run:

```powershell
npm run seed:demo
```

That re-points the database at the new files. Hard-refresh the browser
(Ctrl+Shift+R) since Next caches optimised images.

**Optional but worth it:** convert to WebP first. The PNGs ChatGPT returns
are often 2–3 MB each; WebP at quality 82 lands around 150 KB with no
visible difference. [squoosh.app](https://squoosh.app) does it in the
browser, no install.

---

## Two things to know before you use these with the client

**They are not Avantika's product.** An AI image of generic toor dal is the
same category of stand-in as a stock photo — it looks right, but it is not
what is in their packet. Fine for a demo, and the code still marks these as
placeholders so production publication stays blocked. Real photography is
still what launch needs.

**Check the ad platforms before running paid campaigns.** Meta and Google
have been tightening disclosure rules for AI-generated imagery in ads. For
the website it is a non-issue; for a paid campaign, check the current policy
rather than assuming.

---

## If consistency drifts anyway

The usual failure is image 20 looking nothing like image 2. Two fixes:

1. **Re-anchor every 8–10 images.** Re-paste the Step 1 style block.
2. **Reference the first image.** Upload `emmer-wheat` back into the chat
   and say: "Match this exact lighting, angle, surface and colour grade for
   every remaining image."

If a single image comes out wrong, regenerate that one rather than lowering
the standard — one mismatched tile is more obvious in a four-column grid
than you would expect.
