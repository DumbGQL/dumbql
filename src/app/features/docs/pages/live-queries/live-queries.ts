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
  selector: 'app-docs-live-queries',
  standalone: true,
  imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-queries.html',
  styleUrl: './live-queries.scss',
})
export class DocsLiveQueries {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/subscriptions/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly apiEntries: ApiEntry[] = [
    {
      name: 'GraphqlLiveQuery',
      description:
        'Framework-agnostic class that combines an initial HTTP query fetch with a WebSocket subscription for real-time updates.',
      type: 'class',
    },
    {
      name: 'GraphqlLiveQuery.constructor',
      description: 'Creates a new GraphqlLiveQuery instance with the GraphQL endpoint URL.',
      type: 'constructor',
      default: 'endpoint: string',
    },
    {
      name: 'GraphqlLiveQuery.execute(query, variables?, callbacks?)',
      description:
        'Executes initial HTTP POST fetch, then subscribes via WebSocket using the graphql-transport-ws protocol. Returns a Promise resolving to an unsubscribe function.',
      type: 'method',
    },
  ];

  protected readonly liveQueryStarters: StarterCodes = {
    vanilla: `import { createClient, gql } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});

const TYPED_SUB = gql\`subscription {
  todoUpdated { id title done }
}\`;

// useLiveQuery equivalent — manual fetch + subscription
(async () => {
  const initial = await client.query(gql\`{ todos { id title done } }\`);
  console.log('Initial:', initial.data?.todos);

  for await (const update of client.subscribe(TYPED_SUB)) {
    if (update.status === 'success') {
      console.log('Updated:', update.data.todoUpdated);
    }
  }
})();
`,
    angular: `import { provideDumbql, query, gql } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
  ],
};

// Live queries in Angular use regular query() with polling,
// or combine query with subscriptions
@Component({ ... })
export class LiveTodosComponent implements OnInit {
  private graphql = inject(GraphqlService);

  ngOnInit() {
    this.graphql.query(gql\`{ todos { id title done } }\`).subscribe(result => {
      console.log('Live data:', result.data?.todos);
    });
  }
}
`,
    react: `import { DumbqlProvider, useLiveQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});

function TodoList() {
  const { data, loading } = useLiveQuery(gql\`subscription {
    todoUpdated { id title done }
  }\`);

  if (loading) return <p>Connecting...</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function App() {
  return <DumbqlProvider client={client}><TodoList /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useLiveQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const { data, loading } = useLiveQuery(gql\`subscription {
  todoUpdated { id title done }
}\`);
</script>

<template>
  <p v-if="loading">Connecting...</p>
  <pre v-else>{{ data }}</pre>
</template>
`,
  };

  protected readonly tocSections: TocSection[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'react', title: 'React: useLiveQuery' },
    { id: 'vue', title: 'Vue: useLiveQuery' },
    { id: 'angular', title: 'Angular: Live Queries' },
    { id: 'graphql-live-query', title: 'GraphqlLiveQuery Class' },
    { id: 'protocol', title: 'WebSocket Protocol' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly reactCode = `import { useLiveQuery } from '@dumbql/react';
import { gql } from '@dumbql/client';

const POSTS_LIVE = gql\`
  subscription LivePosts {
    postAdded {
      id
      title
      author { name }
    }
  }
\`;

function LivePosts() {
  const { data, loading, error } = useLiveQuery(POSTS_LIVE, {
    variables: {},
    shouldSubscribe: true,
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <ul>
      {data?.postAdded.map(post => (
        <li key={post.id}>{post.title} — {post.author.name}</li>
      ))}
    </ul>
  );
}`;

  protected readonly vueCode = `import { useLiveQuery } from '@dumbql/vue';
import { gql } from '@dumbql/client';
import { defineComponent } from 'vue';

const POSTS_LIVE = gql\`
  subscription LivePosts {
    postAdded {
      id
      title
      author { name }
    }
  }
\`;

export default defineComponent({
  setup() {
    const { data, loading, error } = useLiveQuery(POSTS_LIVE, {
      variables: {},
      shouldSubscribe: true,
    });

    return { data, loading, error };
  },
});`;

  protected readonly angularCode = `import { Component, inject } from '@angular/core';
import { GraphqlService } from '@dumbql/core';
import { GraphqlLiveQuery } from '@dumbql/subscriptions';
import { gql } from '@dumbql/client';

const POSTS_LIVE = gql\`
  subscription LivePosts {
    postAdded {
      id
      title
      author { name }
    }
  }
\`;

@Component({
  selector: 'app-live-posts',
  standalone: true,
  template: \`
    <ul>
      @for (post of posts; track post.id) {
        <li>{{ post.title }} — {{ post.author?.name }}</li>
      }
    </ul>
  \`,
})
export class LivePosts {
  private gql = inject(GraphqlService);
  posts: Post[] = [];

  constructor() {
    const liveQuery = new GraphqlLiveQuery(this.gql.endpoint);

    liveQuery.execute(POSTS_LIVE, {}, {
      next: (data) => {
        if (data.postAdded) {
          this.posts = [...this.posts, data.postAdded];
        }
      },
      error: (err) => console.error('Live query error', err),
    });
  }
}`;

  protected readonly classCode = `import { GraphqlLiveQuery } from '@dumbql/subscriptions';

const live = new GraphqlLiveQuery('https://api.example.com/graphql');

// Returns an unsubscribe function
const unsubscribe = await live.execute(
  gql\`subscription { notifications { id message } }\`,
  { userId: '123' },
  {
    next: (data) => console.log('New notification:', data),
    error: (err) => console.error('Subscription error:', err),
    complete: () => console.log('Subscription ended'),
  },
);

// Later, to stop listening:
unsubscribe();`;
}
