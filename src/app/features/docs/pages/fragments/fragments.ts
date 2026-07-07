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
  selector: 'app-docs-fragments',
  standalone: true,
  imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fragments.html',
  styleUrl: './fragments.scss',
})
export class DocsFragments {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/fragments');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/fragments/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly fragmentStarters: StarterCodes = {
    vanilla: `import { createClient, createCache, gql } from '@dumbql/client';
import { fragment, spread, compose } from '@dumbql/fragments';

// Define a fragment
const TODO_FIELDS = fragment(gql\`
  fragment TodoFields on Todo {
    id title done
  }
\`);

// Use it in a query
const GET_TODOS = compose(gql\`query { todos { ...TodoFields } }\`,
  spread(TODO_FIELDS),
);

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

async function load() {
  const result = await client.query(GET_TODOS);
  if (result.status === 'success') {
    cache.write(result.data.todos[0]);
  }
}
`,
    angular: `import { provideDumbql, GraphqlService } from '@dumbql/core';
import { fragment, spread, compose } from '@dumbql/fragments';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [provideDumbql({ link: createHttpLink({ uri: '/graphql' }) })],
};

const TODO_FIELDS = fragment(gql\`
  fragment TodoFields on Todo { id title done }
\`);

@Component({ ... })
export class TodosComponent {
  private graphql = inject(GraphqlService);

  todos$ = this.graphql.query(compose(
    gql\`query { todos { ...TodoFields } }\`,
    spread(TODO_FIELDS),
  ));
}
`,
    react: `import { DumbqlProvider, useFragment, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const TODO_FIELDS = gql\`
  fragment TodoFields on Todo { id title done }
\`;

function TodoItem({ id }: { id: string }) {
  const { data, complete } = useFragment(TODO_FIELDS, {
    __typename: 'Todo', id,
  });
  if (!complete) return <p>Loading...</p>;
  return <p>{data.title} — {data.done ? 'done' : 'pending'}</p>;
}

function App() {
  return <DumbqlProvider client={client}><TodoItem id="1" /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useFragment, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const TODO_FIELDS = gql\`
  fragment TodoFields on Todo { id title done }
\`;

const { data, complete } = useFragment(TODO_FIELDS, {
  __typename: 'Todo', id: '1',
});
</script>

<template>
  <p v-if="!complete">Loading...</p>
  <p v-else>{{ data.title }} — {{ data.done ? 'done' : 'pending' }}</p>
</template>
`,
  };

  protected readonly apiEntries: ApiEntry[] = [
    {
      name: 'fragment(strings, ...values)',
      description: 'Tagged template literal that defines a typed fragment reference from a GraphQL fragment string.',
      type: 'function',
    },
    {
      name: 'getFragment(def)',
      description: 'Extracts the underlying DocumentNode from a FragmentDefinition.',
      type: 'function',
    },
    {
      name: 'spread(def)',
      description: 'Returns the fragment spread string (...FragmentName) for use in a GraphQL document.',
      type: 'function',
    },
    {
      name: 'compose(...defs)',
      description: 'Composes multiple FragmentDefinitions into a single DocumentNode by merging their definitions.',
      type: 'function',
    },
    {
      name: 'useFragment(fragment, data)',
      description: 'Extracts typed fragment data from a parent query result. Returns null when data is nullish.',
      type: 'function',
    },
    {
      name: 'FragmentDefinition',
      description: 'Interface defining a typed fragment reference with its parsed DocumentNode and fragment name.',
      type: 'interface',
    },
    {
      name: 'FragmentDefinition.document',
      description: 'The parsed GraphQL DocumentNode for the fragment.',
      type: 'property',
    },
    {
      name: 'FragmentDefinition.name',
      description: 'The name of the fragment extracted from the definition.',
      type: 'property',
    },
  ];

  protected readonly tocSections: TocSection[] = [
    { id: 'fragment', title: 'fragment()' },
    { id: 'spread', title: 'spread()' },
    { id: 'compose', title: 'compose()' },
    { id: 'use-fragment', title: 'useFragment()' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly fragmentCode = `import { fragment } from '@dumbql/fragments';

const BOOK_FIELDS = fragment('Book', gql\`fragment BookFields on Book {
  id
  title
  author { name }
  price
}\`);`;

  protected readonly spreadCode = `import { spread } from '@dumbql/fragments';

const BOOKS_QUERY = gql\`query Books {
  books { ...BookFields }
}\${spread(BOOK_FIELDS)}\`;`;

  protected readonly composeCode = `import { compose } from '@dumbql/fragments';

const AUTHOR_FIELDS = fragment('Author', gql\`fragment AuthorFields on Author {
  id name books { ...BookFields }
}\`);

const fullDocument = compose([BOOK_FIELDS, AUTHOR_FIELDS]);`;

  protected readonly useFragmentCode = `import { useFragment } from '@dumbql/fragments';

@Component({
  selector: 'app-book-card',
  standalone: true,
  template: \`<div>{{ book()?.title }} by {{ book()?.author?.name }}</div>\`,
})
export class BookCardComponent {
  book = useFragment(BOOK_FIELDS, this.graphql.query(BOOKS_QUERY));
}`;
}
