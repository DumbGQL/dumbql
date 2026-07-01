import { Injectable, signal } from '@angular/core';

function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [main, pre] = v.split('-', 2);
    const parts = main.split('.').map(Number);
    return { parts, pre };
  };

  const va = parse(a);
  const vb = parse(b);

  for (let i = 0; i < 3; i++) {
    if (va.parts[i] !== vb.parts[i]) return va.parts[i] - vb.parts[i];
  }

  if (va.pre && !vb.pre) return -1;
  if (!va.pre && vb.pre) return 1;
  if (!va.pre && !vb.pre) return 0;

  const typeOrder: Record<string, number> = { alpha: 0, rc: 1, build: 2 };
  const pa = va.pre!.split('.');
  const pb = vb.pre!.split('.');
  const ta = typeOrder[pa[0]] ?? 99;
  const tb = typeOrder[pb[0]] ?? 99;
  if (ta !== tb) return ta - tb;
  return Number(pa[1] ?? 0) - Number(pb[1] ?? 0);
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  readonly allVersions: readonly string[] = [
    '1.1.7',
    '1.1.6',
    '1.1.5',
    '1.1.4',
    '1.1.3',
    '1.1.2',
    '1.1.1',
    '1.1.0',
    '1.0.1',
    '1.0.0',
    '0.0.10',
    '0.0.8',
    '0.0.7',
    '0.0.6',
    '0.0.5',
    '0.0.4',
    '0.0.3',
    '0.0.2-rc.3',
    '0.0.2-alpha.1',
    '0.0.1',
  ];

  private readonly packageSinceMap: Record<string, string> = {
    '@dumbql/client': '0.0.1',
    '@dumbql/react': '0.0.1',
    '@dumbql/vue': '0.0.1',
    '@dumbql/core': '0.0.1',
    '@dumbql/cache': '0.0.1',
    '@dumbql/subscriptions': '0.0.1',
    '@dumbql/file-upload': '0.0.1',
    '@dumbql/middlewares': '0.0.1',
    '@dumbql/pagination': '0.0.1',
    '@dumbql/persisted-queries': '0.0.1',
    '@dumbql/fragments': '0.0.1',
    '@dumbql/ssr': '0.0.1',
    '@dumbql/debugging': '0.0.1',
    '@dumbql/downloader': '0.0.1',
    '@dumbql/testing': '0.0.1',
    '@dumbql/dev-server': '1.1.0',
  };
  private readonly storageKey = 'dumbql-docs-version';

  readonly currentVersion = signal(this.load());

  setVersion(v: string): void {
    if (this.allVersions.includes(v)) {
      this.currentVersion.set(v);
      localStorage.setItem(this.storageKey, v);
    }
  }

  getPackageSince(packageName: string): string {
    return this.packageSinceMap[packageName] ?? '—';
  }

  isVersionAtLeast(since: string): boolean {
    return compareVersions(this.currentVersion(), since) >= 0;
  }

  private load(): string {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this.allVersions.includes(saved)) return saved;
    return this.allVersions[0];
  }
}
