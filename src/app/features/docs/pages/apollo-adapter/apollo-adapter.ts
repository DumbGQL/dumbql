import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-apollo-adapter',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './apollo-adapter.html',
	styleUrl: './apollo-adapter.scss',
})
export class DocsApolloAdapter {
	private readonly tocService = inject(TocService);

	protected readonly versionService = inject(VersionService);

	protected readonly packageSince = this.versionService.getPackageSince('@dumbql/apollo-adapter');

	protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/apollo-adapter/src/lib';

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API'];

	protected readonly apiEntries: ApiEntry[] = [
		{
			name: 'fromApolloCache(apolloCache)',
			description: 'Converts an Apollo InMemoryCache with its typePolicies into a DumbQL cache configuration.',
			type: 'function',
		},
		{
			name: 'ApolloCacheCompatible',
			description:
				'Minimal interface that Apollo Client InMemoryCache satisfies. Covers readQuery, writeQuery, evict, gc, extract, and restore.',
			type: 'interface',
		},
		{
			name: 'ApolloCacheCompatible.readQuery',
			description: 'Reads a query from the cache.',
			type: 'method',
			default: 'options: { query, variables? }',
		},
		{
			name: 'ApolloCacheCompatible.writeQuery',
			description: 'Writes a query result to the cache.',
			type: 'method',
			default: 'options: { query, variables?, data }',
		},
		{
			name: 'ApolloCacheCompatible.evict',
			description: 'Evicts an entity from the cache by id and optional fieldName.',
			type: 'method',
			default: 'options: { id, fieldName? }',
		},
		{ name: 'ApolloCacheCompatible.gc', description: 'Runs garbage collection on the cache.', type: 'method' },
		{
			name: 'ApolloCacheCompatible.extract',
			description: 'Extracts full cache state, optionally including optimistic data.',
			type: 'method',
			default: 'optimistic?: boolean',
		},
		{
			name: 'ApolloCacheCompatible.restore',
			description: 'Restores cache state from a serialized snapshot.',
			type: 'method',
			default: 'serializedState: Record<string, unknown>',
		},
		{
			name: 'createMigrationGuide()',
			description:
				'Returns a mapping of common Apollo Client patterns to their DumbQL equivalents for incremental migration.',
			type: 'function',
		},
	];

	protected readonly tocSections: TocSection[] = [
		{ id: 'overview', title: 'Overview' },
		{ id: 'from-apollo-cache', title: 'fromApolloCache()' },
		{ id: 'migration-guide', title: 'Migration Guide' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}

	protected readonly fromApolloCode = `import { fromApolloCache } from '@dumbql/apollo-adapter';
import { InMemoryCache } from '@apollo/client';
import { createCache } from '@dumbql/cache';

const apolloCache = new InMemoryCache();

// Convert Apollo typePolicies to DumbQL cache config
const dumbqlCache = fromApolloCache(apolloCache);`;

	protected readonly migrationCode = `import { apolloClient } from './apollo-client';
import { createClient } from '@dumbql/client';
import { migrationGuide } from '@dumbql/apollo-adapter';

const steps = migrationGuide(apolloClient);
// steps: [
//   { file: 'src/client.ts', change: 'replace ApolloClient with createClient' },
//   { file: 'src/cache.ts', change: 'replace InMemoryCache with createCache' },
//   ...
// ]`;
}
