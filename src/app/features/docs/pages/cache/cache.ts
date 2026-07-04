import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-cache',
  standalone: true,
  imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cache.html',
  styleUrl: './cache.scss',
})
export class DocsCache {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/cache');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/cache/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly tocSections: TocSection[] = [
    { id: 'normalized-cache', title: 'NormalizedCache' },
    { id: 'cache-service', title: 'CacheService' },
    { id: 'garbage-collection', title: 'Garbage Collection' },
    { id: 'persistence', title: 'Persistence' },
    { id: 'optimistic-updates', title: 'Optimistic Updates' },
    { id: 'type-policies', title: 'Type Policies' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly apiEntries: ApiEntry[] = [
    { name: 'NormalizedCache', description: 'Low-level normalized document store', type: 'class' },
    { name: 'CacheService', description: 'Injectable cache service', type: 'class' },
    { name: 'provideDumbqlCache(config)', description: 'Provider function for cache', type: 'function', default: '—' },
    { name: 'DumbqlCacheConfig', description: 'Cache configuration interface', type: 'interface' },
    { name: 'TypePolicy', description: 'Type policy for custom normalization', type: 'interface' },
    { name: 'PersistenceConfig', description: 'Persistence configuration', type: 'interface' },
  ];

  protected readonly normalizedCacheCode = `import { NormalizedCache } from '@dumbql/cache';

const cache = new NormalizedCache();
cache.write({ __typename: 'Book', id: '1', title: 'Dune' });
const book = cache.read('Book:1');
// => { __typename: 'Book', id: '1', title: 'Dune' }`;

  protected readonly cacheServiceCode = `import { provideDumbqlCache } from '@dumbql/cache';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbqlCore({ link: createHttpLink({ uri: '/graphql' }) }),
    provideDumbqlCache(),
  ],
};`;

  protected readonly gcCode = `const cacheService = inject(CacheService);
cacheService.gc(); // force garbage collection`;

  protected readonly persistenceCode = `provideDumbqlCache({
  persistence: {
    storage: localStorage,
    key: 'dumbql-cache',
  },
});`;

  protected readonly optimisticCode = `const mutation = this.graphql.mutate(
  gql\`mutation LikePost($id: ID!) { likePost(id: $id) { likes } }\`,
  {
    optimisticResponse: {
      likePost: { __typename: 'Post', likes: currentLikes + 1 },
    },
  },
);`;

  protected readonly typePoliciesCode = `provideDumbqlCache({
  typePolicies: {
    Post: {
      keyFields: ['slug'],
      merge: true,
    },
    PaginatedPosts: {
      merge: (existing, incoming) => ({
        ...incoming,
        items: [...(existing?.items ?? []), ...incoming.items],
      }),
    },
  },
});`;
}
