import { Component, inject, input, signal, computed, ChangeDetectionStrategy, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TuiTab, TuiTabs, TuiCopy } from '@taiga-ui/kit';
import { TuiButton } from '@taiga-ui/core';
import hljs from 'highlight.js';
import { StackblitzStarterService } from '../../stackblitz/stackblitz-starter.service';
import type { StarterCodes } from './index';

@Component({
  selector: 'app-docs-stackblitz-starter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiTab, TuiTabs, TuiButton, TuiCopy],
  template: `
    <tui-tabs>
      <button tuiTab (click)="frameworkIndex.set(0)">Vanilla</button>
      <button tuiTab (click)="frameworkIndex.set(1)">Angular</button>
      <button tuiTab (click)="frameworkIndex.set(2)">React</button>
      <button tuiTab (click)="frameworkIndex.set(3)">Vue</button>
    </tui-tabs>

    <div class="starter-toolbar">
      <button tuiButton size="s" appearance="outline" [tuiButtonCopy]="currentCode()">
        Copy
      </button>
      <button tuiButton size="s" appearance="outline" (click)="openStackblitz()">
        Open in StackBlitz
      </button>
    </div>

    <pre><code [innerHTML]="htmlCode()"></code></pre>
  `,
  styles: [`
    .starter-toolbar { display: flex; gap: 0.5rem; margin: 0.75rem 0; }
  `],
})
export class DocsStackblitzStarterComponent {
  readonly codes = input.required<StarterCodes>();
  readonly title = input('Feature');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly sandbox = inject(StackblitzStarterService);
  protected readonly frameworkIndex = signal(0);

  private readonly frameworkKeys = ['vanilla', 'angular', 'react', 'vue'] as const;

  protected readonly frameworkName = computed(() => this.frameworkKeys[this.frameworkIndex()]);

  protected readonly currentCode = computed(() => {
    const key = this.frameworkKeys[this.frameworkIndex()];
    return this.codes()[key] ?? '';
  });

  protected readonly htmlCode = computed(() => {
    const code = this.currentCode();
    if (!code) return '';
    const highlighted = hljs.highlightAuto(code);
    return this.sanitizer.sanitize(SecurityContext.HTML, highlighted.value) ?? '';
  });

  protected openStackblitz(): void {
    this.sandbox.openStarter(this.currentCode(), this.frameworkName(), this.title());
  }
}
