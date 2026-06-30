import { Component, ChangeDetectionStrategy, afterEveryRender, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import hljs from 'highlight.js';
import { VersionService } from '../../shared/services/version.service';

interface NavItem {
  path: string;
  label: string;
  since: string;
}

@Component({
  selector: 'app-docs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './docs-page.html',
  styleUrl: './docs-page.scss',
})
export class DocsPage {
  private readonly versionService = inject(VersionService);

  constructor() {
    afterEveryRender(() => {
      const blocks = document.querySelectorAll('.docs-content pre code:not(.hljs)');
      if (blocks.length) {
        blocks.forEach((b) => hljs.highlightElement(b as HTMLElement));
      }
    });
  }

  private readonly allNavItems: NavItem[] = [
    { path: '/docs/overview', label: 'Overview', since: '0.0.1' },
    { path: '/docs/getting-started', label: 'Getting Started', since: '0.0.1' },
    { path: '/docs/client', label: '@dumbql/client', since: '0.0.1' },
    { path: '/docs/react', label: '@dumbql/react', since: '0.0.1' },
    { path: '/docs/vue', label: '@dumbql/vue', since: '0.0.1' },
    { path: '/docs/core', label: '@dumbql/core', since: '0.0.1' },
    { path: '/docs/cache', label: '@dumbql/cache', since: '0.0.1' },
    { path: '/docs/subscriptions', label: '@dumbql/subscriptions', since: '0.0.1' },
    { path: '/docs/live-queries', label: 'Live Queries', since: '0.0.2-alpha.1' },
    { path: '/docs/file-upload', label: '@dumbql/file-upload', since: '0.0.1' },
    { path: '/docs/middlewares', label: '@dumbql/middlewares', since: '0.0.1' },
    { path: '/docs/pagination', label: '@dumbql/pagination', since: '0.0.1' },
    { path: '/docs/persisted-queries', label: '@dumbql/persisted-queries', since: '0.0.1' },
    { path: '/docs/fragments', label: '@dumbql/fragments', since: '0.0.1' },
    { path: '/docs/ssr', label: '@dumbql/ssr', since: '0.0.1' },
    { path: '/docs/debugging', label: '@dumbql/debugging', since: '0.0.1' },
    { path: '/docs/downloader', label: '@dumbql/downloader', since: '0.0.1' },
    { path: '/docs/testing', label: '@dumbql/testing', since: '0.0.1' },
    { path: '/docs/comparison', label: 'vs Other Solutions', since: '0.0.1' },
    { path: '/docs/migration', label: 'Migration from Apollo', since: '0.0.2-alpha.1' },
    { path: '/docs/api', label: 'API Reference', since: '0.0.1' },
    { path: '/docs/devcontainers', label: 'Sandboxes', since: '0.0.1' },
  ];

  protected readonly navItems = computed(() =>
    this.allNavItems.filter((item) => this.versionService.isVersionAtLeast(item.since)),
  );
}
