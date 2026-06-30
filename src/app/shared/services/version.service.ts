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
  private readonly allVersions = [
    '1.0.0',
    '0.0.12',
    '0.0.11',
    '0.0.10',
    '0.0.9',
    '0.0.8',
    '0.0.7',
    '0.0.6',
    '0.0.5',
    '0.0.4',
    '0.0.3',
    '0.0.2-alpha.1',
    '0.0.2-rc.3',
    '0.0.2-rc.2',
    '0.0.2-rc.1',
    '0.0.1',
  ];
  private readonly storageKey = 'dumbql-docs-version';

  readonly currentVersion = signal(this.load());

  readonly versions = this.allVersions as readonly string[];

  setVersion(v: string): void {
    if (this.allVersions.includes(v)) {
      this.currentVersion.set(v);
      localStorage.setItem(this.storageKey, v);
    }
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
