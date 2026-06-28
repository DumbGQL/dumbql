import { execSync } from 'node:child_process';
import { existsSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist', 'dumbql');
const NM = join(ROOT, 'node_modules', '@dumbql');

const BUILD_ORDER = [
  'cache',
  'core',
  'client',
  'fragments',
  'downloader',
  'codegen',
  'ssr',
  'subscriptions',
  'middlewares',
  'pagination',
  'persisted-queries',
  'file-upload',
  'debugging',
  'testing',
  'react',
  'vue',
];

function linkPackage(pkg, distOut) {
  const nmLink = join(NM, pkg);
  if (existsSync(nmLink)) {
    try { rmSync(nmLink, { recursive: true }); } catch {}
  }
  if (existsSync(distOut)) {
    symlinkSync(resolve(distOut), nmLink, 'dir');
    console.log(`  🔗 Linked @dumbql/${pkg} → ${resolve(distOut)}`);
  }
}

function build(pkg) {
  console.log(`\n📦 Building @dumbql/${pkg}...`);
  const pkgDir = join(ROOT, 'projects', 'dumbql', pkg);
  const distOut = join(DIST, pkg);

  if (!existsSync(join(pkgDir, 'ng-package.json'))) {
    console.log(`  ℹ️  Plain Node package, copying to dist/${pkg}`);
    mkdirSync(distOut, { recursive: true });
    execSync(`cp -r ${pkgDir}/src ${distOut}/ && cp ${pkgDir}/package.json ${distOut}/`, { cwd: ROOT, stdio: 'inherit' });
    for (const f of ['README.md', 'LICENSE']) {
      const p = join(pkgDir, f);
      if (existsSync(p)) execSync(`cp ${p} ${distOut}/`, { cwd: ROOT, stdio: 'inherit' });
    }
    linkPackage(pkg, distOut);
    return;
  }

  const npxCmd = existsSync(join(ROOT, 'node_modules', '.bin', 'ng-packagr'))
    ? 'npx ng-packagr'
    : 'npx --yes ng-packagr';
  execSync(`${npxCmd} -p ${pkgDir}/ng-package.json`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=4096' },
  });

  linkPackage(pkg, distOut);
}

console.log('🚀 Building all @dumbql packages in dependency order...\n');
for (const pkg of BUILD_ORDER) {
  build(pkg);
}
console.log('\n✅ All packages built!');
