import { Routes } from '@angular/router';
import { docsChildGuard } from './docs.guard';

export const docsRoutes: Routes = [
	{
		path: '',
		loadComponent: () => import('./docs-page').then((m) => m.DocsPage),
		canActivateChild: [docsChildGuard],
		children: [
			{ path: '', redirectTo: 'overview', pathMatch: 'full' },
			{
				path: 'overview',
				loadComponent: () => import('./pages/overview/overview').then((m) => m.DocsOverview),
			},
			{
				path: 'getting-started',
				loadComponent: () => import('./pages/getting-started/getting-started').then((m) => m.DocsGettingStarted),
			},
			{
				path: 'client',
				loadComponent: () => import('./pages/client/client').then((m) => m.DocsClient),
			},
			{
				path: 'react',
				loadComponent: () => import('./pages/react/react').then((m) => m.DocsReact),
			},
			{
				path: 'vue',
				loadComponent: () => import('./pages/vue/vue').then((m) => m.DocsVue),
			},
			{
				path: 'core',
				loadComponent: () => import('./pages/core/core').then((m) => m.DocsCore),
			},
			{
				path: 'cache',
				loadComponent: () => import('./pages/cache/cache').then((m) => m.DocsCache),
			},
			{
				path: 'subscriptions',
				loadComponent: () => import('./pages/subscriptions/subscriptions').then((m) => m.DocsSubscriptions),
			},
			{
				path: 'live-queries',
				data: { since: '0.0.2-alpha.1' },
				loadComponent: () => import('./pages/live-queries/live-queries').then((m) => m.DocsLiveQueries),
			},
			{
				path: 'file-upload',
				loadComponent: () => import('./pages/file-upload/file-upload').then((m) => m.DocsFileUpload),
			},
			{
				path: 'middlewares',
				loadComponent: () => import('./pages/middlewares/middlewares').then((m) => m.DocsMiddlewares),
			},
			{
				path: 'pagination',
				loadComponent: () => import('./pages/pagination/pagination').then((m) => m.DocsPagination),
			},
			{
				path: 'persisted-queries',
				loadComponent: () => import('./pages/persisted-queries/persisted-queries').then((m) => m.DocsPersistedQueries),
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
				path: 'opentelemetry',
				data: { since: '1.0.5-beta.3' },
				loadComponent: () => import('./pages/opentelemetry/opentelemetry').then((m) => m.DocsOpentelemetry),
			},
			{
				path: 'epic-fetus',
				data: { since: '1.0.5-beta.4' },
				loadComponent: () => import('./pages/epic-fetus/epic-fetus').then((m) => m.DocsEpicFetus),
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
				path: 'migration',
				data: { since: '0.0.2-alpha.1' },
				loadComponent: () => import('./pages/migration/migration').then((m) => m.DocsMigration),
			},
			{
				path: 'api',
				loadComponent: () => import('./pages/api/api').then((m) => m.DocsApi),
			},
			{
				path: 'dev-server',
				data: { since: '0.0.3' },
				loadComponent: () => import('./pages/dev-server/dev-server').then((m) => m.DocsDevServer),
			},
			{
				path: 'apollo-adapter',
				data: { since: '0.0.3' },
				loadComponent: () => import('./pages/apollo-adapter/apollo-adapter').then((m) => m.DocsApolloAdapter),
			},
			{
				path: 'codegen',
				data: { since: '0.0.1' },
				loadComponent: () => import('./pages/codegen/codegen').then((m) => m.DocsCodegen),
			},
			{
				path: 'errors',
				data: { since: '0.0.3' },
				loadComponent: () => import('./pages/errors/errors').then((m) => m.DocsErrors),
			},
			{
				path: 'devcontainers',
				loadComponent: () => import('./pages/devcontainers/devcontainers').then((m) => m.DocsDevcontainers),
			},
		],
	},
];
