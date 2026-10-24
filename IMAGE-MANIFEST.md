# Image manifest — what to send, and the exact filename for each

Drop every file into **`public/products/`** (products) or **`public/brand/`**
(everything else), using the filename in the first column exactly — lowercase,
hyphens, no spaces. The code already points at these paths, so a correctly
named file appears on the site with no code change.

**Format:** `.webp` preferred, `.jpg` accepted. If you send `.jpg`, run
`npm run seed:demo` afterwards so the database picks up the new extension.

---

## 1. Products — 31 files

All product shots: **4:5 portrait**, minimum **1200 × 1500 px**.
Shoot the loose grain filling the frame (macro, overhead), not the packet.

### Grains — 8

| Filename | Product | Hindi name | Pack |
|---|---|---|---|
| `emmer-wheat.webp` | Emmer Wheat | Khapli | 1 KG |
| `quinoa.webp` | Quinoa | — | 1 KG |
| `amaranth.webp` | Amaranth | Rajgira | 1 KG |
| `barley.webp` | Barley | Jau | 1 KG |
| `corn.webp` | Corn | Makka | 1 KG |
| `millet.webp` | Millet | Bajra / Jowar | 1 KG |
| `oats.webp` | Oats | Jai | 1 KG |
| `brown-rice.webp` | Brown Rice | Bhura Chawal | 1 KG |

### Pulses — 12

| Filename | Product | Hindi name | Pack |
|---|---|---|---|
| `toor-dal.webp` | Toor Dal | Arhar Dal | 1 KG |
| `moong-dal.webp` | Moong Dal | Yellow Moong | 1 KG |
| `masoor-dal.webp` | Masoor Dal | Red Lentils | 1 KG |
| `chana-dal.webp` | Chana Dal | Bengal Gram | 1 KG |
| `urad-dal.webp` | Urad Dal | Split Black Gram | 1 KG |
| `whole-green-moong.webp` | Whole Green Moong | Sabut Moong | 1 KG |
| `whole-black-urad.webp` | Whole Black Urad | Sabut Urad | 1 KG |
| `kabuli-chana.webp` | Kabuli Chana | White Chickpeas | 1 KG |
| `kala-chana.webp` | Kala Chana | Black Chickpeas | 1 KG |
| `rajma.webp` | Rajma | Kidney Beans | 1 KG |
| `lobia.webp` | Lobia | Black-Eyed Peas | 1 KG |
| `matar.webp` | Dried Peas | Matar | 1 KG |

### Seeds — 8

| Filename | Product | Hindi name | Pack |
|---|---|---|---|
| `pumpkin-seeds.webp` | Pumpkin Seeds | Kaddu Ke Beej | 250 g |
| `chia-seeds.webp` | Chia Seeds | Chia | 250 g |
| `sunflower-seeds.webp` | Sunflower Seeds | Surajmukhi Beej | 250 g |
| `flax-seeds.webp` | Flax Seeds | Alsi | 250 g |
| `sesame-seeds.webp` | Sesame Seeds | Til | 250 g |
| `basil-seeds.webp` | Basil Seeds | Sabja | 250 g |
| `watermelon-seeds.webp` | Watermelon Seeds | Tarbooz Ke Beej | 250 g |
| `hemp-seeds.webp` | Hemp Seeds | Bhang Ke Beej | 250 g |

### Combo packs — 3

Shoot these as a composed set, not loose grain.

| Filename | Product | Pack |
|---|---|---|
| `combo-pulses.webp` | Premium Pulses Combo | 1 KG |
| `combo-grains.webp` | Heritage Grains Combo | 1 KG |
| `combo-seeds.webp` | Super Seeds Combo | 1 KG |

---

## 2. Brand and section imagery — `public/brand/`

| Filename | Where it appears | Size | Notes |
|---|---|---|---|
| `logo.svg` | Header, footer | vector | Wheat-ear mark + wordmark lockup |
| `logo-mark.svg` | Favicon, mobile header | vector, square | Just the mark |
| `hero.webp` | Homepage hero, full-bleed | 2400 × 1400 | Macro wheat. Keep the left third visually quiet — the headline sits there |
| `hero-1.webp` … `hero-3.webp` | Homepage hero carousel | 2000 × 750 | Supplied — desktop marketing banners |
| `hero-1-mobile.webp` … | Hero carousel on phones | 1080 × 1350 | **Wanted.** The desktop banners are 2.67:1; at phone width their headline is too small to read, so the site currently crops to the photography and lets the HTML heading carry the message. A 4:5 version of each banner, with the type re-set for small screens, would be better |
| `mill-exterior.webp` | About page | 2000 × 1200 | The Depalpur facility from outside |
| `mill-floor.webp` | Manufacturing page | 2000 × 1200 | Machinery, wide |
| `optical-sorter.webp` | Manufacturing — Select stage | 1600 × 1200 | The sorter in operation |
| `milling-rollers.webp` | Manufacturing — Mill stage | 1600 × 1200 | Rollers / stone |
| `lab-testing.webp` | Quality page | 1600 × 1200 | Grading or lab bench |
| `packing-line.webp` | Quality / About | 1600 × 1200 | Packing and sealing |
| `bulk-sacks.webp` | Bulk orders page | 2000 × 1200 | Stacked 25 kg sacks |
| `founder.webp` | About page (optional) | 1200 × 1200 | Square portrait |
| `og-default.webp` | Social sharing preview | 1200 × 630 | Logo over a grain shot |

---

## 3. Shooting notes

These decide whether the site looks expensive or ordinary.

- **One light direction across every product shot.** Mixed lighting is the
  fastest way a grid stops looking like one brand.
- **Fill the frame.** Overhead, grain edge to edge, no visible bowl rim, no
  props, no wooden spoon.
- **Same camera height and distance** for all 31, so the grid feels like a
  set rather than 31 separate photos.
- **Shoot on a neutral surface** — the site is dark, so mid-to-dark grounds
  sit better than white.
- **No text, watermarks or packaging labels** burned into the image.
- **No stock photos with another brand's packet visible.** That is the one
  thing that cannot be fixed in post.

---

## 4. Until the real photos arrive

Two interim options, both already wired:

```powershell
npm run gen:images     # generated vector stand-ins (current)
npm run fetch:images   # licensed Unsplash photos, needs a free API key
```

Both mark images as placeholders, so the Product model refuses to publish in
production until genuine photography replaces them. Replacing a file is all
it takes — same filename, same folder, no code change.
