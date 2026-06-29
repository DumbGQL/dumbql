import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private readonly allVersions = ['0.0.2-alpha.1', '0.0.2-rc.2', '0.0.2-rc.1', '0.0.1'];
  private readonly storageKey = 'dumbql-docs-version';

  readonly currentVersion = signal(this.load());

  readonly versions = this.allVersions as readonly string[];

  setVersion(v: string): void {
    if (this.allVersions.includes(v)) {
      this.currentVersion.set(v);
      localStorage.setItem(this.storageKey, v);
    }
  }

  private load(): string {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && this.allVersions.includes(saved)) return saved;
    return this.allVersions[0];
  }
}
