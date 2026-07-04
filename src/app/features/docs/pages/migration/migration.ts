import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-migration',
  standalone: true,
  imports: [TuiBadge, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './migration.html',
  styleUrl: './migration.scss',
})
export class DocsMigration {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly tocSections: TocSection[] = [
    { id: 'why-migrate', title: 'Why Migrate?' },
    { id: 'cli-usage', title: 'CLI Usage' },
    { id: 'manual-migration', title: 'Manual Migration' },
    { id: 'adapter-guide', title: 'Adapter: Incremental Migration' },
    { id: 'comparison-table', title: 'Apollo vs DumbQL API Mapping' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly apolloDumbqlMapping = [
    { apollo: 'ApolloClient', dumbql: 'DumbqlClient (from @dumbql/client)' },
    { apollo: 'InMemoryCache', dumbql: 'CacheStore (from @dumbql/cache)' },
    { apollo: 'ApolloProvider', dumbql: 'DumbqlProvider (from @dumbql/react)' },
    { apollo: 'Apollo Angular (apollo-angular)', dumbql: '@dumbql/core (Angular-native)' },
    { apollo: 'new ApolloClient({ uri, cache })', dumbql: 'new DumbqlClient({ endpoint })' },
    { apollo: 'client.query({ query, variables })', dumbql: 'client.query(query, variables)' },
    { apollo: 'client.mutate({ mutation, variables })', dumbql: 'client.mutate(document, variables)' },
    { apollo: 'useQuery(query, { variables })', dumbql: 'useQuery(query, { variables }) — same API, options object' },
    { apollo: 'useMutation(query, { variables, update })', dumbql: 'useMutation(query, { variables, update })' },
    { apollo: 'useSubscription(query)', dumbql: 'useSubscription(query)' },
    { apollo: 'subscribeToMore()', dumbql: 'useLiveQuery()' },
    { apollo: 'cache.readQuery({ query, variables })', dumbql: 'cache.query(__typename, id)' },
    { apollo: 'cache.writeQuery({ query, data })', dumbql: 'cache.write(entity)' },
    { apollo: 'cache.evict({ id })', dumbql: 'cache.evict(__typename, id)' },
    { apollo: 'cache.modify({ id, fields })', dumbql: 'cache.merge()' },
    { apollo: 'cache.gc()', dumbql: 'cache.collectGarbage()' },
    { apollo: 'makeVar(value)', dumbql: 'makeVar(value) (from @dumbql/core)' },
    { apollo: 'reactiveVar()', dumbql: 'reactiveVar() (from @dumbql/core)' },
    { apollo: '@client directives', dumbql: 'clientDirectiveMiddleware()' },
    { apollo: 'Apollo Link chain', dumbql: 'GraphqlMiddleware pipeline' },
    { apollo: 'errorPolicy', dumbql: 'errorPolicy in DumbqlClient config' },
    { apollo: 'fetchPolicy', dumbql: 'fetchPolicy in DumbqlClient config' },
    { apollo: 'pollInterval', dumbql: 'pollInterval in useQuery options' },
    { apollo: 'refetchQueries', dumbql: 'client.refetch() / useQuery().refetch()' },
    { apollo: 'optimisticResponse', dumbql: 'optimistic option in mutate()' },
    { apollo: 'typePolicies / keyFields', dumbql: 'Zero-config — auto __typename + id detection' },
  ];

  protected readonly adapterCode = `import { fromApolloCache } from '@dumbql/apollo-adapter';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { DumbqlClient } from '@dumbql/client';
import { CacheStore } from '@dumbql/cache';

// Keep Apollo client for existing code
const apolloCache = new InMemoryCache();
const apolloClient = new ApolloClient({ uri, cache: apolloCache });

// Create DumbQL client, wrapping Apollo's cache for compatibility
const dumbqlCache = new CacheStore();
const dumbqlClient = new DumbqlClient({ endpoint: uri, cache: dumbqlCache });

// Create adapter so DumbQL can read from Apollo cache
const adapter = fromApolloCache(apolloCache);

// Use adapter.query() to read Apollo cache data from DumbQL
const migratedData = adapter.query('Book', '1');`;

  protected readonly migrationSteps = [
    {
      step: '1. Install DumbQL',
      code: 'npm install @dumbql/client @dumbql/cache',
      desc: 'Start with the core packages. Add framework bindings and middleware as needed.',
    },
    {
      step: '2. Create DumbQL client',
      code: `import { DumbqlClient } from '@dumbql/client';
import { CacheStore } from '@dumbql/cache';

const cache = new CacheStore();
const client = new DumbqlClient({
  endpoint: 'https://api.example.com/graphql',
  cache,
});`,
      desc: 'Replace ApolloClient + InMemoryCache with DumbqlClient + CacheStore',
    },
    {
      step: '3. Replace React provider',
      code: `// Before:
import { ApolloProvider } from '@apollo/client';
<ApolloProvider client={apolloClient}><App /></ApolloProvider>

// After:
import { DumbqlProvider } from '@dumbql/react';
<DumbqlProvider client={dumbqlClient}><App /></DumbqlProvider>`,
      desc: 'Framework provider names change. Vue and Angular follow similar patterns.',
    },
    {
      step: '4. Migrate queries',
      code: `// Before:
const { loading, error, data } = useQuery(MY_QUERY, { variables: { id } });

// After (same API, options object):
const { loading, error, data, networkStatus, called } = useQuery(MY_QUERY, { variables: { id } });`,
      desc: 'DumbQL hooks return the same shape plus extras (networkStatus, called, fetchMore).',
    },
    {
      step: '5. Migrate mutations with cache update',
      code: `// Before:
const [likePost] = useMutation(LIKE_POST, {
  update(cache, { data }) {
    const existing = cache.readQuery({ query: GET_POSTS });
    cache.writeQuery({ query: GET_POSTS, data: { ... } });
  },
});

// After (same update pattern):
const [likePost] = useMutation(LIKE_POST, {
  update(cache, { data }) {
    // cache here is DumbQL CacheStore (compatible via fromApolloCache)
    cache.merge({ __typename: 'Post', id: data.likePost.id, likes: data.likePost.likes });
  },
});`,
      desc: 'The update callback receives DumbQL CacheStore instance. Use cache.merge() instead of readQuery/writeQuery.',
    },
    {
      step: '6. Add middleware',
      code: `import { loggingMiddleware, authRefreshMiddleware } from '@dumbql/middlewares';

const client = new DumbqlClient({
  endpoint: 'https://api.example.com/graphql',
  middleware: [
    loggingMiddleware('MyApp'),
    authRefreshMiddleware({ getToken: () => localStorage.getItem('token') }),
  ],
});`,
      desc: 'Replace Apollo Links with DumbQL middleware pipeline. Built-in middlewares cover auth, retry, offline, APQ, batching.',
    },
  ];
}
