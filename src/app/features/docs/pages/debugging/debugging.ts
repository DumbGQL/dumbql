import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-debugging',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './debugging.html',
	styleUrl: './debugging.scss',
})
export class DocsDebugging {
	protected readonly tocSections: TocSection[] = [
		{ id: 'debug-service', title: 'Debug Service' },
		{ id: 'parse-field-tree', title: 'parseFieldTree()' },
		{ id: 'mutation-chart', title: 'buildMutationChart()' },
		{ id: 'normalize-data', title: 'normalizeData()' },
	];

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
}
