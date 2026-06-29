import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const PKGS_DIR = join(ROOT, 'projects', 'dumbql');
const CORE_PKG = join(PKGS_DIR, 'core', 'package.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}
function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

function currentVersion() {
  return readJson(CORE_PKG).version;
}

function nextVersion(current, type) {
  const parts = current.split('-')[0].split('.').map(Number);
  let [major, minor, patch] = parts;

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch': {
      const base = current.split('-')[0];
      const pMatch = base.match(/\.(\d+)$/);
      return `${major}.${minor}.${parseInt(pMatch[1]) + 1}`;
    }
    case 'rc': {
      const rcMatch = current.match(/-rc\.(\d+)$/);
      const rc = rcMatch ? parseInt(rcMatch[1]) + 1 : 1;
      const base = rcMatch ? current.replace(/-rc\.\d+$/, '') : `${major}.${minor}.${patch}`;
      return `${base}-rc.${rc}`;
    }
    case 'beta': {
      const bMatch = current.match(/-beta\.(\d+)$/);
      const b = bMatch ? parseInt(bMatch[1]) + 1 : 1;
      const base = bMatch ? current.replace(/-beta\.\d+$/, '') : `${major}.${minor}.${patch}`;
      return `${base}-beta.${b}`;
    }
    case 'alpha': {
      const aMatch = current.match(/-alpha\.(\d+)$/);
      const a = aMatch ? parseInt(aMatch[1]) + 1 : 1;
      const base = aMatch ? current.replace(/-alpha\.\d+$/, '') : `${major}.${minor}.${patch}`;
      return `${base}-alpha.${a}`;
    }
    default:
      throw new Error(`Unknown version type: ${type}. Use: major, minor, patch, rc, beta, alpha`);
  }
}

const type = process.argv[2];
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
const noCommit = process.argv.includes('--no-commit');
if (!type) {
  console.log('Usage: node scripts/version.mjs <major|minor|patch|rc|beta|alpha> [--dry-run] [--no-commit]');
  process.exit(1);
}

const cur = currentVersion();
const next = nextVersion(cur, type);

console.log(`  Current: ${cur}`);
console.log(`  Next:    ${next}`);

// Bump all packages
const dirs = [PKGS_DIR];
for (const dir of dirs) {
  for (const entry of readdirSync(dir)) {
    const pkgPath = join(dir, entry, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = readJson(pkgPath);
      if (pkg.name?.startsWith('@dumbql/')) {
        pkg.version = next;
        writeJson(pkgPath, pkg);
        console.log(`  ✓ ${pkg.name} → ${next}`);
      }
    }
  }
}

// Bump root package.json
const rootPkg = readJson(join(ROOT, 'package.json'));
rootPkg.version = next;
writeJson(join(ROOT, 'package.json'), rootPkg);
console.log(`  ✓ root → ${next}`);

// Also bump dist/dumbql/* if present (for local publish testing)
const distDir = join(ROOT, 'dist', 'dumbql');
if (existsSync(distDir)) {
  for (const entry of readdirSync(distDir)) {
    const pkgPath = join(distDir, entry, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = readJson(pkgPath);
      if (pkg.name?.startsWith('@dumbql/')) {
        pkg.version = next;
        writeJson(pkgPath, pkg);
      }
    }
  }
}

if (dryRun) {
  console.log(`\n  [DRY RUN] Skipping git commit + tag`);
} else if (noCommit) {
  console.log(`\n  [NO COMMIT] Version files updated, skipping git ops`);
} else {
  execSync(`git add -A && git commit -m "chore: bump to ${next}"`, { cwd: ROOT, stdio: 'inherit' });
  execSync(`git tag v${next}`, { cwd: ROOT, stdio: 'inherit' });
  console.log(`\n  Tagged: v${next}`);
  console.log(`  Run: git push origin v${next} --no-verify`);
}
