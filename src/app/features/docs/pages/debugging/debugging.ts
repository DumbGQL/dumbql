import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-debugging',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './debugging.html',
  styleUrl: './debugging.scss',
})
export class DocsDebugging {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/debugging');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/debugging/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'debug-service', title: 'Debug Service' },
      { id: 'parse-field-tree', title: 'parseFieldTree()' },
      { id: 'mutation-chart', title: 'buildMutationChart()' },
      { id: 'normalize-data', title: 'normalizeData()' },
    ]);
  }

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
