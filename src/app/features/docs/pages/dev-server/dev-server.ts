import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-dev-server',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './dev-server.html',
	styleUrl: './dev-server.scss',
})
export class DocsDevServer {
	private readonly tocService = inject(TocService);

	protected readonly versionService = inject(VersionService);

	protected readonly packageSince = this.versionService.getPackageSince('@dumbql/dev-server');

	protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/dev-server/src/lib';

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API'];

	protected readonly apiEntries: ApiEntry[] = [
		{
			name: 'createDevServer(config?)',
			description: 'Creates a Node.js http.Server with mock GraphQL endpoint and proxy middleware.',
			type: 'function',
		},
		{
			name: 'startDevServer(config?)',
			description:
				'Creates and starts the dev server on the given port. Waits for the frontend target to become available.',
			type: 'function',
		},
		{
			name: 'analyzeEnvironment(rewriteOverride?)',
			description:
				'Detects the runtime environment (StackBlitz, Codespaces, or local) and returns environment info including URL rewrite requirements.',
			type: 'function',
		},
		{
			name: 'resolvePublicFrontendHost(incomingHost, frontendPort?, devServerPort?)',
			description:
				'Derives the public frontend host from the incoming Host header for URL rewriting in cloud environments.',
			type: 'function',
		},
		{
			name: 'DevServerConfig',
			description: 'Configuration interface for the dev server with mock, proxy, port, spawn, and staticDir options.',
			type: 'interface',
		},
		{
			name: 'DevServerConfig.mock',
			description: 'Mock GraphQL configuration with inline schema or file path and optional resolvers.',
			type: 'property',
		},
		{
			name: 'DevServerConfig.proxy',
			description: 'Proxy configuration for forwarding non-GraphQL requests to the frontend dev server.',
			type: 'property',
		},
		{
			name: 'DevServerConfig.port',
			description: 'Port for the dev server to listen on.',
			type: 'property',
			default: '4000',
		},
		{
			name: 'DevServerConfig.spawn',
			description: 'Spawn configuration to run a child process (e.g. the frontend dev server).',
			type: 'property',
		},
		{
			name: 'DevServerConfig.staticDir',
			description: 'Directory to serve static files from, overrides proxy when set.',
			type: 'property',
		},
		{
			name: 'MockConfig',
			description: 'Configuration for mock GraphQL endpoint with inline schema or file path and resolvers.',
			type: 'interface',
		},
		{
			name: 'MockConfig.schema',
			description: 'Inline GraphQL schema string or file path to a .graphql file.',
			type: 'property',
		},
		{
			name: 'MockConfig.resolvers',
			description: 'Custom resolver functions for mock schema fields.',
			type: 'property',
		},
		{
			name: 'ProxyConfig',
			description: 'Proxy configuration for forwarding requests to the frontend dev server.',
			type: 'interface',
		},
		{
			name: 'ProxyConfig.target',
			description: 'Target URL for the frontend dev server (e.g. http://localhost:4200).',
			type: 'property',
		},
		{
			name: 'ProxyConfig.rewrite',
			description: 'Force-enables URL rewriting of localhost URLs to public host in proxied responses.',
			type: 'property',
		},
		{
			name: 'RuntimeEnv',
			description: 'Union type of supported runtime environments: local, stackblitz, codespaces, or unknown.',
			type: 'interface',
		},
		{
			name: 'EnvInfo',
			description: 'Environment info including runtime type, URL rewrite requirement, and public frontend host.',
			type: 'interface',
		},
		{ name: 'EnvInfo.runtime', description: 'Detected runtime environment.', type: 'property' },
		{
			name: 'EnvInfo.needsUrlRewrite',
			description: 'Whether absolute localhost URLs should be rewritten to the public host.',
			type: 'property',
		},
		{
			name: 'EnvInfo.publicFrontendHost',
			description: 'The public-facing host of the frontend dev server if determinable.',
			type: 'property',
		},
	];

	protected readonly tocSections: TocSection[] = [
		{ id: 'quick-start', title: 'Quick Start' },
		{ id: 'configuration', title: 'Configuration' },
		{ id: 'cli', title: 'CLI Options' },
		{ id: 'api', title: 'Programmatic API' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}

	protected readonly cliCode = 'npx dumbql-dev --proxy http://localhost:4200';

	protected readonly configCode = `{
  "mock": {
    "schema": "type Query { getNotes: [Note!]! } type Note { id: ID! title: String! content: String! }"
  },
  "proxy": {
    "target": "http://localhost:5173"
  }
}`;

	protected readonly programmaticCode = `import { createDevServer, startDevServer } from '@dumbql/dev-server';

const server = createDevServer({
  mock: {
    schema: 'type Query { ping: String }',
    resolvers: { Query: { ping: () => 'pong' } },
  },
  proxy: { target: 'http://localhost:4200' },
});

startDevServer({ port: 4000 });`;
}
