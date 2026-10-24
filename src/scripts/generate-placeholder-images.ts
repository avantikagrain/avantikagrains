/**
 * Generates product imagery.
 *
 *   npm run gen:images
 *
 * These are vector stand-ins, not photographs — but they are built to read
 * as a macro shot of loose grain rather than as a flat icon: a lit surface,
 * a shallow pile with depth and shadow, per-kernel variation in size,
 * rotation, tone and opacity, and a turbulence overlay for organic texture.
 *
 * Why not stock photos by default: see fetch-unsplash-images.ts. Run that
 * if an Unsplash key is available; it produces better results than any
 * generated art. Either way the images are marked `isPlaceholder`, so the
 * Product model refuses production publication until the mill supplies its
 * own photography.
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { chromium } from '@playwright/test';


const OUT_DIR = resolve('public/products');

/**
 * Records which slugs this script produced. A file present on disk but
 * absent from here was supplied by the business, so it is never overwritten.
 */
const MANIFEST = resolve(OUT_DIR, '.generated.json');

function readManifest(): Set<string> {
  try {
    return new Set(JSON.parse(readFileSync(MANIFEST, 'utf8')) as string[]);
  } catch {
    return new Set();
  }
}

type Category = 'Grains' | 'Pulses' | 'Seeds' | 'Combo Packs';

/**
 * Per-ingredient colouring. Real grain is not one flat colour, so each
 * entry carries a tonal range that individual kernels are sampled from.
 */
interface Palette {
  surface: [string, string]; // lit → shadowed ground
  kernel: string[]; // kernel tones, light to dark
  accent?: string;
}

const PALETTES: Record<string, Palette> = {
  wheat: { surface: ['#F6EFDC', '#E4D6B4'], kernel: ['#D9B870', '#C9A253', '#B08A3E', '#8F6D2C'] },
  barley: { surface: ['#F4EEDC', '#DFD5B6'], kernel: ['#DCC68C', '#C8AE6E', '#AE9552', '#8E7840'] },
  oats:   { surface: ['#F7F2E4', '#E6DCC4'], kernel: ['#E8D9B4', '#D6C296', '#BFA87A', '#9D8860'] },
  corn:   { surface: ['#F8F1D8', '#E8D9A8'], kernel: ['#F2CE5A', '#E0B83E', '#C79C2C', '#A37D22'] },
  rice:   { surface: ['#F5EFE2', '#E2D7C0'], kernel: ['#D8C3A0', '#C4AB83', '#A98E66', '#8A7250'] },
  millet: { surface: ['#F4EFDF', '#E0D6BB'], kernel: ['#CFAE72', '#B99455', '#9E7B3F', '#7F6130'] },
  quinoa: { surface: ['#F7F2E6', '#E6DCC8'], kernel: ['#EADCC0', '#D5C3A0', '#B8A280', '#8E7A5C'] },
  amaranth: { surface: ['#F6F0E2', '#E4D8C0'], kernel: ['#E3CFA6', '#CDB684', '#AF9765', '#8A7349'] },

  toor:   { surface: ['#F8F0D6', '#E9D9A4'], kernel: ['#F0C44E', '#DCAB33', '#C29124', '#9E741C'] },
  moong:  { surface: ['#F7F1D8', '#E7DAAA'], kernel: ['#EFD363', '#DBBC46', '#BFA032', '#9A8026'] },
  masoor: { surface: ['#F8EADF', '#EBD0B8'], kernel: ['#E79A64', '#D4804A', '#B86838', '#95522B'] },
  chana:  { surface: ['#F8F0D4', '#EAD9A2'], kernel: ['#EEC558', '#D9AA3C', '#BE9029', '#997320'] },
  urad:   { surface: ['#EFEBE4', '#D7D1C6'], kernel: ['#8C8578', '#6E685C', '#4F4A41', '#332F29'] },
  greenmoong: { surface: ['#EFF2E2', '#D6DCBE'], kernel: ['#8FA355', '#75883F', '#5C6D2F', '#425022'] },
  kabuli: { surface: ['#F7F1E0', '#E7DABB'], kernel: ['#E3CC9C', '#CFB47E', '#B29660', '#8D7649'] },
  kala:   { surface: ['#F0EADF', '#D8CEBC'], kernel: ['#8A6F4E', '#6E573C', '#52402B', '#382B1D'] },
  rajma:  { surface: ['#F6E9E2', '#E5CCC0'], kernel: ['#B5503C', '#9A3E2D', '#7E3022', '#5E2219'] },
  lobia:  { surface: ['#F7F2E6', '#E8DECA'], kernel: ['#EDE0C6', '#D8C8A8', '#BCA986', '#4A4038'] },
  matar:  { surface: ['#F0F2E0', '#D8DEBC'], kernel: ['#A8B861', '#8D9E48', '#738336', '#586627'] },

  pumpkin: { surface: ['#F1F2E2', '#D9DEC0'], kernel: ['#9DB062', '#86994B', '#6D7F38', '#546428'] },
  chia:    { surface: ['#F0EDE6', '#D6D1C6'], kernel: ['#7D7266', '#5E5549', '#423B32', '#2B2620'] },
  sunflower: { surface: ['#F5F0E4', '#E3DAC4'], kernel: ['#6B5F4E', '#4E4436', '#D9CDB4', '#352E24'] },
  flax:    { surface: ['#F5EEDF', '#E3D6B8'], kernel: ['#A9753C', '#8C5D2C', '#6E4720', '#523418'] },
  sesame:  { surface: ['#F7F3E8', '#E7DFCA'], kernel: ['#F0E4CA', '#DCCCAA', '#C0AE8A', '#9C8A68'] },
  basil:   { surface: ['#EFECE4', '#D4CEC2'], kernel: ['#6E6558', '#52493E', '#3A332B', '#262119'] },
  watermelon: { surface: ['#F2EEE4', '#DAD3C4'], kernel: ['#5C5248', '#403832', '#E8DECB', '#2C2520'] },
  hemp:    { surface: ['#F4F2E6', '#DFDCC6'], kernel: ['#C9C3A2', '#B0A985', '#918A68', '#6E684C'] },
};

const PALETTE_BY_SLUG: Record<string, Palette> = {
  'emmer-wheat': PALETTES.wheat,
  barley: PALETTES.barley,
  oats: PALETTES.oats,
  corn: PALETTES.corn,
  'brown-rice': PALETTES.rice,
  millet: PALETTES.millet,
  quinoa: PALETTES.quinoa,
  amaranth: PALETTES.amaranth,
  'toor-dal': PALETTES.toor,
  'moong-dal': PALETTES.moong,
  'masoor-dal': PALETTES.masoor,
  'chana-dal': PALETTES.chana,
  'urad-dal': PALETTES.urad,
  'whole-green-moong': PALETTES.greenmoong,
  'whole-black-urad': PALETTES.urad,
  'kabuli-chana': PALETTES.kabuli,
  'kala-chana': PALETTES.kala,
  rajma: PALETTES.rajma,
  lobia: PALETTES.lobia,
  matar: PALETTES.matar,
  'pumpkin-seeds': PALETTES.pumpkin,
  'chia-seeds': PALETTES.chia,
  'sunflower-seeds': PALETTES.sunflower,
  'flax-seeds': PALETTES.flax,
  'sesame-seeds': PALETTES.sesame,
  'basil-seeds': PALETTES.basil,
  'watermelon-seeds': PALETTES.watermelon,
  'hemp-seeds': PALETTES.hemp,
  'combo-pulses': PALETTES.toor,
  'combo-grains': PALETTES.wheat,
  'combo-seeds': PALETTES.pumpkin,
};

/** Kernel geometry per family — a lentil is not shaped like a wheat berry. */
type Shape = 'berry' | 'disc' | 'round' | 'teardrop' | 'flat';

const SHAPE_BY_SLUG: Record<string, Shape> = {
  'emmer-wheat': 'berry', barley: 'berry', oats: 'flat', corn: 'teardrop',
  'brown-rice': 'berry', millet: 'round', quinoa: 'disc', amaranth: 'round',
  'toor-dal': 'disc', 'moong-dal': 'disc', 'masoor-dal': 'disc', 'chana-dal': 'disc',
  'urad-dal': 'disc', 'whole-green-moong': 'round', 'whole-black-urad': 'round',
  'kabuli-chana': 'round', 'kala-chana': 'round', rajma: 'teardrop', lobia: 'teardrop',
  matar: 'round',
  'pumpkin-seeds': 'flat', 'chia-seeds': 'disc', 'sunflower-seeds': 'teardrop',
  'flax-seeds': 'teardrop', 'sesame-seeds': 'teardrop', 'basil-seeds': 'round',
  'watermelon-seeds': 'flat', 'hemp-seeds': 'round',
  'combo-pulses': 'disc', 'combo-grains': 'berry', 'combo-seeds': 'teardrop',
};

/** Deterministic PRNG so regenerating produces byte-identical files. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5; h >>>= 0;
    return (h >>> 0) / 4294967296;
  };
}

function kernelPath(shape: Shape, r: number): string {
  switch (shape) {
    case 'berry':
      return `<ellipse rx="${(r * 0.52).toFixed(1)}" ry="${r.toFixed(1)}"/>`;
    case 'disc':
      return `<ellipse rx="${r.toFixed(1)}" ry="${(r * 0.74).toFixed(1)}"/>`;
    case 'round':
      return `<circle r="${(r * 0.86).toFixed(1)}"/>`;
    case 'teardrop':
      return `<path d="M0,${(-r).toFixed(1)} C${(r * 0.72).toFixed(1)},${(-r * 0.5).toFixed(1)} ${(r * 0.66).toFixed(1)},${(r * 0.62).toFixed(1)} 0,${r.toFixed(1)} C${(-r * 0.66).toFixed(1)},${(r * 0.62).toFixed(1)} ${(-r * 0.72).toFixed(1)},${(-r * 0.5).toFixed(1)} 0,${(-r).toFixed(1)} Z"/>`;
    case 'flat':
      return `<ellipse rx="${(r * 0.62).toFixed(1)}" ry="${(r * 1.05).toFixed(1)}"/>`;
  }
}

/**
 * Builds a full-bleed bed of grain.
 *
 * The earlier version scattered a few hundred kernels in a centred oval,
 * which read as shapes on a gradient. A macro photograph of loose grain
 * fills the entire frame and the kernels crowd and overlap — so this packs
 * a jittered grid edge to edge, oversamples past the canvas bounds so there
 * is no visible margin, and layers several passes to build depth.
 */
function bed(palette: Palette, shape: Shape, rand: () => number): string {
  const W = 1200;
  const H = 1500;

  interface Kernel { x: number; y: number; r: number; rot: number; tone: string; shade: number }
  const kernels: Kernel[] = [];

  /**
   * Each pass is one layer of the heap. Lower layers are darker and
   * slightly smaller (further from the light), upper layers brighter and
   * larger — which is what produces readable depth rather than a flat mat.
   */
  const passes = [
    { step: 30, jitter: 20, scale: 0.86, shade: 0.26, toneBias: 0.8 },
    { step: 34, jitter: 24, scale: 1.0, shade: 0.1, toneBias: 0.42 },
    { step: 42, jitter: 30, scale: 1.12, shade: 0.0, toneBias: 0.08 },
  ];

  for (const pass of passes) {
    // Start outside the canvas so kernels bleed past every edge.
    for (let y = -40; y < H + 40; y += pass.step) {
      for (let x = -40; x < W + 40; x += pass.step) {
        if (rand() > 0.94) continue; // occasional gap, so it is not a lattice

        const px = x + (rand() - 0.5) * pass.jitter * 2;
        const py = y + (rand() - 0.5) * pass.jitter * 2;

        // Light falls from the upper left, so tone darkens toward the
        // lower right. This is the single cue that sells it as lit.
        const lightFall =
          (px / W) * 0.42 + (py / H) * 0.5 + (rand() - 0.5) * 0.3;

        const toneIndex = Math.min(
          palette.kernel.length - 1,
          Math.max(0, Math.round(lightFall * pass.toneBias * palette.kernel.length + rand() * 0.9)),
        );

        kernels.push({
          x: px,
          y: py,
          r: (15 + rand() * 7) * pass.scale,
          rot: rand() * 360,
          tone: palette.kernel[toneIndex],
          shade: pass.shade + lightFall * 0.08,
        });
      }
    }
  }

  // Painter's algorithm: back to front so overlaps stack believably.
  kernels.sort((a, b) => a.y - b.y);

  const parts: string[] = [];
  for (const k of kernels) {
    const g = kernelPath(shape, k.r);
    parts.push(
      `<g transform="translate(${k.x.toFixed(1)} ${k.y.toFixed(1)}) rotate(${k.rot.toFixed(0)})">` +
        `<g opacity="0.26" transform="translate(1.4 2.2)" fill="#2A200F">${g}</g>` +
        `<g fill="${k.tone}">${g}</g>` +
        (k.shade > 0.02
          ? `<g fill="#1A1206" opacity="${Math.min(0.34, k.shade).toFixed(2)}">${g}</g>`
          : '') +
      `</g>`,
    );
  }

  return parts.join('');
}

function escapeXml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSvg(p: {
  slug: string; name: string; localName?: string; packSize: string; category: Category;
}): string {
  const palette = PALETTE_BY_SLUG[p.slug] ?? PALETTES.wheat;
  const shape = SHAPE_BY_SLUG[p.slug] ?? 'berry';
  const rand = rng(p.slug);

  // 4:5 — matches the .media aspect ratio, so no layout shift on decode.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500" role="img" aria-label="${escapeXml(p.name)}">
<defs>
  <radialGradient id="lit" cx="38%" cy="30%" r="82%">
    <stop offset="0%" stop-color="${palette.surface[0]}"/>
    <stop offset="62%" stop-color="${palette.surface[0]}"/>
    <stop offset="100%" stop-color="${palette.surface[1]}"/>
  </radialGradient>

  <linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1A1206" stop-opacity="0.62"/>
    <stop offset="100%" stop-color="#1A1206" stop-opacity="0"/>
  </linearGradient>

  <linearGradient id="scrimBottom" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1A1206" stop-opacity="0"/>
    <stop offset="100%" stop-color="#1A1206" stop-opacity="0.58"/>
  </linearGradient>

  <radialGradient id="vignette" cx="50%" cy="46%" r="74%">
    <stop offset="60%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#2A2114" stop-opacity="0.2"/>
  </radialGradient>

  <!-- Fine fractal noise, used at low opacity so the flat vector surface
       picks up the irregularity a photographed surface would have. -->
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="3" seed="7" result="n"/>
    <feColorMatrix type="saturate" values="0" in="n" result="g"/>
  </filter>
</defs>

<rect width="1200" height="1500" fill="url(#lit)"/>
<rect width="1200" height="1500" fill="${palette.kernel[palette.kernel.length - 1]}" opacity="0.7"/>

${bed(palette, shape, rand)}

<rect width="1200" height="1500" fill="url(#vignette)"/>
<rect width="1200" height="1500" filter="url(#grain)" opacity="0.055" style="mix-blend-mode:multiply"/>


</svg>
`;
}

/**
 * Rasterises the generated vectors.
 *
 * The SVG for a full-bleed bed runs to roughly a megabyte, and next/image
 * passes SVG through without optimisation — so the browser would download
 * the lot. Rasterising to WebP here brings each file to ~100KB and lets
 * Next serve properly sized AVIF/WebP variants from it.
 */
async function main() {
  const csvPath = resolve(process.argv[2] ?? 'data/products-seed.csv');
  const rows = parse(readFileSync(csvPath, 'utf8'), {
    columns: true, skip_empty_lines: true, trim: true,
  }) as Record<string, string>[];

  mkdirSync(OUT_DIR, { recursive: true });

  const previouslyGenerated = readManifest();
  const nowGenerated: string[] = [];

  const browser = await chromium.launch({
    // Set by the container image; harmless when undefined elsewhere.
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1500 },
    deviceScaleFactor: 1,
  });

  let generated = 0;
  let kept = 0;

  for (const row of rows) {
    // Supplied photography always wins. Re-running the generator after real
    // images land must not quietly replace them with vector stand-ins.
    const existing = resolve(OUT_DIR, `${row.slug}.webp`);
    if (existsSync(existing) && !process.argv.includes('--force') && !previouslyGenerated.has(row.slug)) {
      kept += 1;
      continue;
    }

    const svg = buildSvg({
      slug: row.slug,
      name: row.name,
      localName: row.local_name || undefined,
      packSize: row.pack_size,
      category: row.category as Category,
    });

    await page.setContent(
      `<body style="margin:0">${svg}</body>`,
      { waitUntil: 'load' },
    );
    await page.screenshot({
      path: resolve(OUT_DIR, `${row.slug}.webp`),
      type: 'webp',
      quality: 82,
    });

    // Remove the oversized vector left by an earlier run.
    const stale = resolve(OUT_DIR, `${row.slug}.svg`);
    if (existsSync(stale)) rmSync(stale);
    generated += 1;
    nowGenerated.push(row.slug);
  }

  await browser.close();

  writeFileSync(MANIFEST, JSON.stringify(nowGenerated, null, 2));

  console.log(`Generated ${generated} stand-in images; kept ${kept} supplied photographs.`);
  if (generated > 0) {
    console.log('Stand-ins are not photography — those products stay unpublishable.');
  }
  if (kept > 0) {
    console.log('Pass --force to regenerate everything, including over real photos.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
