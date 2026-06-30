import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-live-queries',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './live-queries.html',
  styleUrl: './live-queries.scss',
})
export class DocsLiveQueries {
  protected readonly versionService = inject(VersionService);

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/subscriptions/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'react', title: 'React: useLiveQuery' },
    { id: 'vue', title: 'Vue: useLiveQuery' },
    { id: 'angular', title: 'Angular: Live Queries' },
    { id: 'graphql-live-query', title: 'GraphqlLiveQuery Class' },
    { id: 'protocol', title: 'WebSocket Protocol' },
  ];

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
