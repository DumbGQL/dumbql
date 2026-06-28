import { copyFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const browser = process.argv[2];
if (!browser || (browser !== 'chrome' && browser !== 'firefox')) {
  console.error('Usage: node tools/bundle-extension.mjs <chrome|firefox>');
  process.exit(1);
}

const src  = resolve('./browser-extension');
const dest = resolve(`./dist/browser-extension/${browser}`);
const manifestSrc = resolve(src, `manifest.${browser}.json`);
const manifestDest = resolve(dest, 'manifest.json');

if (!existsSync(manifestSrc)) {
  console.error(`Manifest not found: ${manifestSrc}`);
  process.exit(1);
}

// clean and recreate
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

// copy all extension files (JS, HTML, CSS, icons)
cpSync(src, dest, {
  recursive: true,
  filter: (f) => {
    const name = basename(f);
    return !name.startsWith('manifest.') || name === `manifest.${browser}.json`;
  },
});

// rename browser-specific manifest to manifest.json
copyFileSync(manifestSrc, manifestDest);
rmSync(resolve(dest, `manifest.${browser}.json`));

console.log(`Extension bundled for ${browser}: ${dest}`);
