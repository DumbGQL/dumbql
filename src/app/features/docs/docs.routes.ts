import { Routes } from '@angular/router';

export const docsRoutes: Routes = [
	{
		path: '',
		loadComponent: () => import('./docs-page').then((m) => m.DocsPage),
		children: [
			{ path: '', redirectTo: 'overview', pathMatch: 'full' },
			{
				path: 'overview',
				loadComponent: () => import('./pages/overview/overview').then((m) => m.DocsOverview),
			},
			{
				path: 'getting-started',
				loadComponent: () =>
					import('./pages/getting-started/getting-started').then((m) => m.DocsGettingStarted),
			},
			{
				path: 'client',
				loadComponent: () =>
					import('./pages/client/client').then((m) => m.DocsClient),
			},
			{
				path: 'react',
				loadComponent: () =>
					import('./pages/react/react').then((m) => m.DocsReact),
			},
			{
				path: 'vue',
				loadComponent: () =>
					import('./pages/vue/vue').then((m) => m.DocsVue),
			},
			{
				path: 'core',
				loadComponent: () =>
					import('./pages/core/core').then((m) => m.DocsCore),
			},
			{
				path: 'cache',
				loadComponent: () =>
					import('./pages/cache/cache').then((m) => m.DocsCache),
			},
			{
				path: 'subscriptions',
				loadComponent: () =>
					import('./pages/subscriptions/subscriptions').then((m) => m.DocsSubscriptions),
			},
			{
				path: 'file-upload',
				loadComponent: () =>
					import('./pages/file-upload/file-upload').then((m) => m.DocsFileUpload),
			},
			{
				path: 'middlewares',
				loadComponent: () =>
					import('./pages/middlewares/middlewares').then((m) => m.DocsMiddlewares),
			},
			{
				path: 'pagination',
				loadComponent: () =>
					import('./pages/pagination/pagination').then((m) => m.DocsPagination),
			},
			{
				path: 'persisted-queries',
				loadComponent: () =>
					import('./pages/persisted-queries/persisted-queries').then((m) => m.DocsPersistedQueries),
			},
			{
				path: 'fragments',
				loadComponent: () => import('./pages/fragments/fragments').then((m) => m.DocsFragments),
			},
			{
				path: 'ssr',
				loadComponent: () => import('./pages/ssr/ssr').then((m) => m.DocsSsr),
			},
			{
				path: 'debugging',
				loadComponent: () => import('./pages/debugging/debugging').then((m) => m.DocsDebugging),
			},
			{
				path: 'downloader',
				loadComponent: () => import('./pages/downloader/downloader').then((m) => m.DocsDownloader),
			},
			{
				path: 'testing',
				loadComponent: () => import('./pages/testing/testing').then((m) => m.DocsTesting),
			},
			{
				path: 'comparison',
				loadComponent: () => import('./pages/comparison/comparison').then((m) => m.DocsComparison),
			},
			{
				path: 'api',
				loadComponent: () => import('./pages/api/api').then((m) => m.DocsApi),
			},
			{
				path: 'devcontainers',
				loadComponent: () =>
					import('./pages/devcontainers/devcontainers').then((m) => m.DocsDevcontainers),
			},
		],
	},
];
