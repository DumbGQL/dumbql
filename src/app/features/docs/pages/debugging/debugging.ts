import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { TuiButton } from '@taiga-ui/core';
import { TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-debugging',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiButton, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './debugging.html',
	styleUrl: './debugging.scss',
})
export class DocsDebugging {
	private readonly tocService = inject(TocService);

	protected readonly versionService = inject(VersionService);

	protected readonly packageSince = this.versionService.getPackageSince('@dumbql/debugging');

	protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/debugging/src/lib';

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API'];

	protected readonly apiEntries: ApiEntry[] = [
		{
			name: 'GraphqlDebugService',
			description:
				'Debug logging service that records operation type, document, variables, timestamp, duration, result for up to 500 entries.',
			type: 'class',
		},
		{
			name: 'GraphqlDebugService.entries',
			description: 'Read-only array of recorded debug entries.',
			type: 'property',
		},
		{
			name: 'GraphqlDebugService.enabled',
			description: 'Toggle debug recording on/off.',
			type: 'property',
			default: 'true',
		},
		{
			name: 'GraphqlDebugService.query(document, variables?)',
			description: 'Executes a query and logs the operation.',
			type: 'method',
		},
		{
			name: 'GraphqlDebugService.mutate(document, variables?)',
			description: 'Executes a mutation and logs the operation.',
			type: 'method',
		},
		{ name: 'GraphqlDebugService.clear()', description: 'Clears all recorded debug entries.', type: 'method' },
		{
			name: 'GraphqlDebugEntry',
			description: 'Recorded debug entry with timing, doc, variables, and result.',
			type: 'interface',
		},
		{ name: 'GraphqlDebugEntry.type', description: 'Operation type: query or mutate.', type: 'property' },
		{ name: 'GraphqlDebugEntry.document', description: 'Raw GraphQL document string.', type: 'property' },
		{ name: 'GraphqlDebugEntry.variables', description: 'Variables sent with the operation.', type: 'property' },
		{ name: 'GraphqlDebugEntry.timestamp', description: 'Start timestamp from performance.now().', type: 'property' },
		{ name: 'GraphqlDebugEntry.duration', description: 'Duration in ms.', type: 'property' },
		{ name: 'GraphqlDebugEntry.result', description: 'GraphQLResult with status, data, or error.', type: 'property' },
		{ name: 'GraphqlDebugEntry.operationName', description: 'Extracted operation name, if any.', type: 'property' },
		{ name: 'GraphqlDebugEntry.fields', description: 'Extracted field names from the document.', type: 'property' },
		{
			name: 'parseFieldTree(query)',
			description: 'Parses a GraphQL query into a structured field tree object for visualization or analysis.',
			type: 'function',
		},
		{ name: 'InspectedField', description: 'A node in the parsed field tree.', type: 'interface' },
		{ name: 'InspectedField.name', description: 'Field name.', type: 'property' },
		{ name: 'InspectedField.depth', description: 'Nesting depth of this field.', type: 'property' },
		{ name: 'InspectedField.children', description: 'Child fields, if any.', type: 'property' },
		{
			name: 'buildMutationChart(entries)',
			description: 'Generates a timeline chart from debug entries for visualization.',
			type: 'function',
		},
		{ name: 'MutationChartPoint', description: 'A single point on the mutation timeline chart.', type: 'interface' },
		{ name: 'MutationChartPoint.label', description: 'Operation label or anonymous.', type: 'property' },
		{ name: 'MutationChartPoint.start', description: 'Start offset relative to earliest entry.', type: 'property' },
		{ name: 'MutationChartPoint.end', description: 'End offset relative to earliest entry.', type: 'property' },
		{ name: 'MutationChartPoint.duration', description: 'Duration in ms.', type: 'property' },
		{ name: 'MutationChartPoint.ok', description: 'Whether the operation succeeded.', type: 'property' },
		{
			name: 'normalizeData(data, parentPath?)',
			description: 'Normalizes raw server data into normalized entities keyed by __typename + id.',
			type: 'function',
		},
		{ name: 'NormalizedEntity', description: 'A single normalized cache entity.', type: 'interface' },
		{ name: 'NormalizedEntity.type', description: '__typename value.', type: 'property' },
		{ name: 'NormalizedEntity.id', description: 'Entity ID (id or _id field).', type: 'property' },
		{
			name: 'NormalizedEntity.path',
			description: 'Dot-notation path to the entity in the response.',
			type: 'property',
		},
		{
			name: 'groupEntities(entries)',
			description: 'Groups normalized entities by their __typename.',
			type: 'function',
		},
		{
			name: 'provideDevToolsPanel()',
			description: 'Angular provider that registers the DevTools keyboard shortcut (Ctrl+Shift+D).',
			type: 'function',
		},
		{
			name: 'DevToolsService',
			description: 'Service managing DevTools panel visibility, tabs, and cache snapshots.',
			type: 'class',
		},
		{ name: 'DevToolsService.visible$', description: 'Observable of panel visibility.', type: 'property' },
		{ name: 'DevToolsService.activeTab$', description: 'Observable of active tab.', type: 'property' },
		{ name: 'DevToolsService.cacheSnapshot$', description: 'Observable of cache snapshot.', type: 'property' },
		{ name: 'DevToolsService.entries', description: 'Live debug entries from GraphqlDebugService.', type: 'property' },
		{ name: 'DevToolsService.cacheSnapshotValue', description: 'Synchronous cache snapshot value.', type: 'property' },
		{ name: 'DevToolsService.init()', description: 'Initializes keyboard shortcut listener.', type: 'method' },
		{ name: 'DevToolsService.destroy()', description: 'Removes keyboard shortcut listener.', type: 'method' },
		{ name: 'DevToolsService.toggle()', description: 'Toggles DevTools panel visibility.', type: 'method' },
		{ name: 'DevToolsService.open()', description: 'Opens DevTools panel.', type: 'method' },
		{ name: 'DevToolsService.close()', description: 'Closes DevTools panel.', type: 'method' },
		{ name: 'DevToolsService.setTab(tab)', description: 'Switches to a specific tab.', type: 'method' },
		{ name: 'DevToolsService.getQueryCount()', description: 'Returns total recorded query count.', type: 'method' },
		{ name: 'DevToolsService.getErrorCount()', description: 'Returns total recorded error count.', type: 'method' },
		{ name: 'DevToolsTab', description: 'Available DevTools tabs: queries, cache, errors.', type: 'type' },
		{ name: 'CacheSnapshot', description: 'Snapshot of a single cache entity.', type: 'interface' },
		{ name: 'CacheSnapshot.typename', description: 'Entity __typename.', type: 'property' },
		{ name: 'CacheSnapshot.id', description: 'Entity ID.', type: 'property' },
		{ name: 'CacheSnapshot.fields', description: 'All fields of the entity.', type: 'property' },
		{
			name: 'DevToolsPanelComponent',
			description: 'Standalone Angular component rendering the DevTools panel UI.',
			type: 'class',
		},
		{
			name: 'provideDumbqlDebugging(config)',
			description: 'Angular provider that enables detailed logging of all DumbQL operations.',
			type: 'function',
		},
	];

	protected readonly tocSections: TocSection[] = [
		{ id: 'browser-extension', title: 'Browser Extension' },
		{ id: 'devtools-service', title: 'DevTools Service' },
		{ id: 'request-timeline', title: 'Request Timeline' },
		{ id: 'detail-tabs', title: 'Detail Tabs' },
		{ id: 'schema-browser', title: 'Schema Browser' },
		{ id: 'field-projection', title: 'Field Projection' },
		{ id: 'subscription-monitor', title: 'Subscription Monitor' },
		{ id: 'data-export', title: 'Data Export/Import' },
		{ id: 'debug-service', title: 'Debug Service' },
		{ id: 'parse-field-tree', title: 'parseFieldTree()' },
		{ id: 'mutation-chart', title: 'buildMutationChart()' },
		{ id: 'normalize-data', title: 'normalizeData()' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}

	protected readonly devtoolsSetupCode = `import { provideDumbql, devtoolsMiddleware } from '@dumbql/core';

provideDumbql({
  endpoint: '/graphql',
  devtools: {
    autoConnect: true,
    maxRequests: 500,
    captureSchema: true,
    endpoint: '/graphql',
  },
});`;

	protected readonly devtoolsMiddlewareCode = `import { devtoolsMiddleware } from '@dumbql/core';

// Manual middleware setup
const middleware = devtoolsMiddleware({
  autoConnect: true,
  maxRequests: 500,
  captureSchema: true,
});`;

	protected readonly debugServiceCode = `import { provideDumbqlDebugging } from '@dumbql/debugging';

provideDumbqlDebugging({
  logQueries: true,
  logMutations: true,
  logCacheOps: true,
  logMiddleware: true,
});`;

	protected readonly parseFieldTreeCode = `import { parseFieldTree } from '@dumbql/debugging';

const tree = parseFieldTree(gql\`query {
  books(limit: 10) {
    id
    title
    author { name }
  }
}\`);

console.log(tree);
// {
//   books: {
//     args: { limit: 10 },
//     fields: { id: {}, title: {}, author: { name: {} } }
//   }
// }`;

	protected readonly mutationChartCode = `import { buildMutationChart } from '@dumbql/debugging';

const chart = buildMutationChart(
  gql\`mutation LikePost($id: ID!) { likePost(id: $id) { id likes } }\`,
);
// Returns a structured graph of cache interactions`;

	protected readonly normalizeDataCode = `import { normalizeData } from '@dumbql/debugging';

const normalized = normalizeData(
  {
    __typename: 'Query',
    books: [
      { __typename: 'Book', id: '1', title: 'Dune' },
    ],
  },
  { keyFields: ['id'] },
);

console.log(normalized);
// {
//   'Book:1': { __typename: 'Book', id: '1', title: 'Dune' },
//   'Query': { books: ['Book:1'] },
// }`;

	protected readonly extensionInstallCode = `# Firefox
npx dumbql-ext install firefox

# Chrome
npx dumbql-ext install chrome`;
}
