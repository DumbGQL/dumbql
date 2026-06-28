import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
	selector: 'app-docs-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterLink, RouterLinkActive, RouterOutlet],
	templateUrl: './docs-page.html',
	styleUrl: './docs-page.scss',
})
export class DocsPage {
	protected readonly navItems = [
		{ path: '/docs/overview', label: 'Overview' },
		{ path: '/docs/getting-started', label: 'Getting Started' },
		{ path: '/docs/client', label: '@dumbql/client' },
		{ path: '/docs/react', label: '@dumbql/react' },
		{ path: '/docs/vue', label: '@dumbql/vue' },
		{ path: '/docs/core', label: '@dumbql/core' },
		{ path: '/docs/cache', label: '@dumbql/cache' },
		{ path: '/docs/subscriptions', label: '@dumbql/subscriptions' },
		{ path: '/docs/file-upload', label: '@dumbql/file-upload' },
		{ path: '/docs/middlewares', label: '@dumbql/middlewares' },
		{ path: '/docs/pagination', label: '@dumbql/pagination' },
		{ path: '/docs/persisted-queries', label: '@dumbql/persisted-queries' },
		{ path: '/docs/fragments', label: '@dumbql/fragments' },
		{ path: '/docs/ssr', label: '@dumbql/ssr' },
		{ path: '/docs/debugging', label: '@dumbql/debugging' },
		{ path: '/docs/downloader', label: '@dumbql/downloader' },
		{ path: '/docs/testing', label: '@dumbql/testing' },
		{ path: '/docs/comparison', label: 'vs Other Solutions' },
		{ path: '/docs/api', label: 'API Reference' },
	];
}
