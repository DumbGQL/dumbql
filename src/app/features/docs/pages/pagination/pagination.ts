import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-pagination',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './pagination.html',
	styleUrl: './pagination.scss',
})
export class DocsPagination {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/pagination');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/pagination/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'offsetPagination(document, options)', description: 'Creates an observable pagination state with loadMore/refresh for offset-based APIs.', type: 'function' },
  	{ name: 'OffsetPaginationConfig', description: 'Configuration for offset pagination merge function.', type: 'interface' },
  	{ name: 'OffsetPaginationConfig.limit', description: 'Default page size.', type: 'property', default: '20' },
  	{ name: 'OffsetPaginationConfig.offset', description: 'Initial offset.', type: 'property', default: '0' },
  	{ name: 'OffsetPaginationState<T>', description: 'Observable pagination state with items, offset, hasMore, loading, error.', type: 'interface' },
  	{ name: 'OffsetPaginationState.items', description: 'Accumulated items array.', type: 'property' },
  	{ name: 'OffsetPaginationState.offset', description: 'Current offset.', type: 'property' },
  	{ name: 'OffsetPaginationState.limit', description: 'Current page size.', type: 'property' },
  	{ name: 'OffsetPaginationState.hasMore', description: 'Whether more pages are available.', type: 'property' },
  	{ name: 'OffsetPaginationState.loading', description: 'Whether a fetch is in progress.', type: 'property' },
  	{ name: 'OffsetPaginationState.error', description: 'Error message if fetch failed.', type: 'property' },
  	{ name: 'OffsetPaginationResult<T>', description: 'Result shape expected from offset-based query responses.', type: 'interface' },
  	{ name: 'OffsetPaginationResult.items', description: 'Page items.', type: 'property' },
  	{ name: 'OffsetPaginationResult.totalCount', description: 'Total item count.', type: 'property' },
  	{ name: 'OffsetPaginationResult.hasMore', description: 'Whether more pages exist.', type: 'property' },
  	{ name: 'offsetMerge(existing, incoming, options?)', description: 'Cache merge function for offset-based pagination using args.offset.', type: 'function' },
  	{ name: 'cursorPagination(document, variables?)', description: 'Creates a QueryHandle for Relay-style cursor-based pagination.', type: 'function' },
  	{ name: 'CursorPaginationConfig', description: 'Configuration for cursor pagination merge function.', type: 'interface' },
  	{ name: 'CursorPaginationConfig.first', description: 'Number of items to fetch.', type: 'property', default: '—' },
  	{ name: 'CursorPaginationConfig.after', description: 'Cursor to fetch items after.', type: 'property', default: '—' },
  	{ name: 'CursorPaginationResult<T>', description: 'Result shape for cursor-based paginated queries.', type: 'interface' },
  	{ name: 'CursorPaginationResult.items', description: 'Accumulated items.', type: 'property' },
  	{ name: 'CursorPaginationResult.cursor', description: 'Last cursor for next page.', type: 'property' },
  	{ name: 'CursorPaginationResult.hasMore', description: 'Whether more pages exist.', type: 'property' },
  	{ name: 'PageInfo', description: 'Relay connection PageInfo with cursors and booleans.', type: 'interface' },
  	{ name: 'PageInfo.hasNextPage', description: 'Whether more pages exist forward.', type: 'property' },
  	{ name: 'PageInfo.hasPreviousPage', description: 'Whether more pages exist backward.', type: 'property' },
  	{ name: 'PageInfo.startCursor', description: 'Cursor of the first edge.', type: 'property' },
  	{ name: 'PageInfo.endCursor', description: 'Cursor of the last edge.', type: 'property' },
  	{ name: 'CursorEdge<T>', description: 'A single edge with node and cursor.', type: 'interface' },
  	{ name: 'CursorEdge.node', description: 'The item.', type: 'property' },
  	{ name: 'CursorEdge.cursor', description: 'Cursor for this edge.', type: 'property' },
  	{ name: 'CursorConnection<T>', description: 'Relay connection shape with edges, pageInfo, and optional totalCount.', type: 'interface' },
  	{ name: 'CursorConnection.edges', description: 'Array of edges.', type: 'property' },
  	{ name: 'CursorConnection.pageInfo', description: 'PageInfo with cursors.', type: 'property' },
  	{ name: 'CursorConnection.totalCount', description: 'Optional total count.', type: 'property' },
  	{ name: 'cursorMerge(existing, incoming)', description: 'Cache merge function for cursor-based pagination (appends incoming).', type: 'function' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'offset-pagination', title: 'offsetPagination' },
  	{ id: 'cursor-pagination', title: 'cursorPagination' },
  	{ id: 'merge-functions', title: 'Merge Functions' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly offsetPaginationCode = `import { offsetPagination } from '@dumbql/pagination';
import { provideDumbqlCache } from '@dumbql/cache';

provideDumbqlCache({
  typePolicies: {
    BooksConnection: {
      merge: offsetPagination({ offsetField: 'page', limitField: 'limit' }),
    },
  },
});`;

  protected readonly cursorPaginationCode = `import { cursorPagination } from '@dumbql/pagination';

provideDumbqlCache({
  typePolicies: {
    PostConnection: {
      merge: cursorPagination({
        cursorField: 'cursor',
        edgesField: 'edges',
        pageInfoField: 'pageInfo',
      }),
    },
  },
});`;

  protected readonly paginationStarters: StarterCodes = {
    vanilla: `import { createClient, gql, isSuccess } from '@dumbql/client';
import { cursorPagination, offsetPagination } from '@dumbql/pagination';

const client = createClient({ endpoint: '/graphql' });

const FEED = gql\`query Feed($first: Int!, $after: String) {
  feed(first: $first, after: $after) {
    edges { node { id title } }
    pageInfo { endCursor hasNextPage }
  }
}\`;

// Cursor-based pagination helper
const paginate = cursorPagination();

async function loadMore(cursor?: string) {
  const result = await client.query(FEED, { first: 10, after: cursor });
  if (isSuccess(result)) {
    const { edges, pageInfo } = result.data.feed;
    paginate(edges, pageInfo);
    console.log('Items:', edges.length, 'Has more:', pageInfo.hasNextPage);
  }
}

loadMore(); // first page
`,
    angular: `import { provideDumbql, GraphqlService, gql } from '@dumbql/core';
import { cursorPagination } from '@dumbql/pagination';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
  ],
};

@Component({ ... })
export class FeedComponent {
  private graphql = inject(GraphqlService);
  items: any[] = [];
  pageInfo: any;

  loadMore(cursor?: string) {
    this.graphql.query(gql\`query Feed($first: Int!, $after: String) {
      feed(first: $first, after: $after) {
        edges { node { id title } }
        pageInfo { endCursor hasNextPage }
      }
    }\`, { variables: { first: 10, after: cursor } }).subscribe(res => {
      if (res.status === 'success') {
        this.items.push(...res.data.feed.edges);
        this.pageInfo = res.data.feed.pageInfo;
      }
    });
  }
}
`,
    react: `import { DumbqlProvider, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const FEED = gql\`query Feed($first: Int!, $after: String) {
  feed(first: $first, after: $after) {
    edges { node { id title } }
    pageInfo { endCursor hasNextPage }
  }
}\`;

function Feed() {
  const { data, fetchMore } = useQuery(FEED, {
    variables: { first: 10 },
  });

  return (
    <div>
      <ul>
        {data?.feed.edges.map(e => <li key={e.node.id}>{e.node.title}</li>)}
      </ul>
      {data?.feed.pageInfo.hasNextPage && (
        <button onClick={() => fetchMore({
          variables: { after: data.feed.pageInfo.endCursor },
        })}>Load More</button>
      )}
    </div>
  );
}

function App() {
  return <DumbqlProvider client={client}><Feed /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const FEED = gql\`query Feed($first: Int!, $after: String) {
  feed(first: $first, after: $after) {
    edges { node { id title } }
    pageInfo { endCursor hasNextPage }
  }
}\`;

const { data, fetchMore } = useQuery(FEED, { variables: { first: 10 } });
</script>

<template>
  <ul>
    <li v-for="e in data?.feed.edges" :key="e.node.id">{{ e.node.title }}</li>
  </ul>
  <button v-if="data?.feed.pageInfo.hasNextPage"
    @click="fetchMore({ variables: { after: data.feed.pageInfo.endCursor } })">
    Load More
  </button>
</template>
`,
  };

  protected readonly customMergeCode = `// Custom merge example
provideDumbqlCache({
  typePolicies: {
    Comments: {
      merge: (existing, incoming, { args }) => {
        if (!existing) return incoming;
        return {
          ...incoming,
          items: args?.refresh
            ? incoming.items
            : [...existing.items, ...incoming.items],
        };
      },
    },
  },
});`;
}
