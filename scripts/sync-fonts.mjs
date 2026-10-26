import { copyFileSync, mkdirSync } from 'node:fs';

const WANTED = {
  inter: ['inter-latin-300-normal', 'inter-latin-400-normal', 'inter-latin-500-normal'],
  'playfair-display': [
    'playfair-display-latin-400-normal',
    'playfair-display-latin-500-normal',
    'playfair-display-latin-600-normal',
  ],
};

mkdirSync('public/fonts', { recursive: true });

let copied = 0;
for (const [pkg, files] of Object.entries(WANTED)) {
  for (const file of files) {
    const from = `node_modules/@fontsource/${pkg}/files/${file}.woff2`;
    try {
      copyFileSync(from, `public/fonts/${file}.woff2`);
      copied += 1;
    } catch (err) {
      console.error(`✗ ${from} — ${err.code === 'ENOENT' ? 'not found' : err.message}`);
      console.error('  Run `npm install` first, or check the @fontsource version.');
      process.exit(1);
    }
  }
}

console.log(`✓ ${copied} font files synced to public/fonts`);
