import { execSync } from 'node:child_process';
import { existsSync, rmSync, symlinkSync, mkdirSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist', 'dumbql');
const NM = join(ROOT, 'node_modules', '@dumbql');

const BUILD_ORDER = [
  'cache',
  'errors',
  'core',
  'client',
  'dev-server',
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
  'apollo-adapter',
  'react',
  'vue',
];

// Packages compiled with tsc (not ng-packagr, not plain copy)
const TSC_PACKAGES = ['react', 'vue', 'dev-server'];

function linkPackage(pkg, distOut) {
  const nmLink = join(NM, pkg);
  if (existsSync(nmLink)) {
    try { rmSync(nmLink, { recursive: true }); } catch {}
  }
  if (existsSync(distOut)) {
    mkdirSync(NM, { recursive: true });
    symlinkSync(resolve(distOut), nmLink, 'dir');
    console.log(`  🔗 Linked @dumbql/${pkg} → ${resolve(distOut)}`);
  }
}

function build(pkg) {
  console.log(`\n📦 Building @dumbql/${pkg}...`);
  const pkgDir = join(ROOT, 'projects', 'dumbql', pkg);
  const distOut = join(DIST, pkg);

  if (existsSync(join(pkgDir, 'ng-package.json'))) {
    // Angular package — build with ng-packagr
    const npxCmd = existsSync(join(ROOT, 'node_modules', '.bin', 'ng-packagr'))
      ? 'npx ng-packagr'
      : 'npx --yes ng-packagr';
    execSync(`${npxCmd} -p ${pkgDir}/ng-package.json`, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=4096' },
    });
    linkPackage(pkg, distOut);
    return;
  }

  if (TSC_PACKAGES.includes(pkg)) {
    // TypeScript package — compile with tsc
    const tsconfig = join(pkgDir, 'tsconfig.lib.json');
    console.log(`  🔧 Compiling TypeScript...`);
    mkdirSync(distOut, { recursive: true });
    execSync(`npx tsc -p ${tsconfig}`, { cwd: ROOT, stdio: 'inherit' });
    cpSync(join(pkgDir, 'package.json'), join(distOut, 'package.json'));
    // Copy bin/ directory if present (for CLI tools)
    const binDir = join(pkgDir, 'bin');
    if (existsSync(binDir)) {
      execSync(`cp -r ${binDir} ${distOut}/`, { cwd: ROOT, stdio: 'inherit' });
    }
    for (const f of ['README.md', 'LICENSE']) {
      const p = join(pkgDir, f);
      if (existsSync(p)) cpSync(p, join(distOut, f));
    }
    linkPackage(pkg, distOut);
    return;
  }

  // Plain Node package — copy source directly
  console.log(`  ℹ️  Plain Node package, copying to dist/${pkg}`);
  mkdirSync(distOut, { recursive: true });
  execSync(`cp -r ${pkgDir}/src ${distOut}/ && cp ${pkgDir}/package.json ${distOut}/`, { cwd: ROOT, stdio: 'inherit' });
  for (const f of ['README.md', 'LICENSE']) {
    const p = join(pkgDir, f);
    if (existsSync(p)) execSync(`cp ${p} ${distOut}/`, { cwd: ROOT, stdio: 'inherit' });
  }
  linkPackage(pkg, distOut);
}

console.log('🚀 Building all @dumbql packages in dependency order...\n');
for (const pkg of BUILD_ORDER) {
  build(pkg);
}
console.log('\n✅ All packages built!');
