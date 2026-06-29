import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-react',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './react.html',
	styleUrl: './react.scss',
})
export class DocsReact {
	protected readonly versionService = inject(VersionService);

	protected readonly tocSections: TocSection[] = [
		{ id: 'quick-start', title: 'Quick Start' },
		{ id: 'hooks', title: 'Hooks' },
		{ id: 'render-props', title: 'Render-prop Components' },
		{ id: 'context', title: 'Context & Provider' },
	];

	protected readonly quickStartCode = `import { DumbqlProvider, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

const GET_TODOS = gql\`query Todos { todos { id title } }\`;

function Todos() {
  const { data, loading, error, refetch } = useQuery(GET_TODOS);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {data.todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  );
}

function App() {
  return (
    <DumbqlProvider client={client} cache={cache}>
      <Todos />
    </DumbqlProvider>
  );
}`;

	protected readonly mutationCode = `const ADD_TODO = gql\`mutation AddTodo($title: String!) {
  addTodo(title: $title) { id title }
}\`;

function AddTodoForm() {
  const [mutate, { data, loading, error }] = useMutation(ADD_TODO);
  return <button onClick={() => mutate({ title: 'New' })}>Add</button>;
}`;

	protected readonly subscriptionCode = `const { data } = useSubscription(
  gql\`subscription OnMessage { messageAdded { content } }\`,
);`;

	protected readonly renderPropCode = `import { Query, Mutation, gql } from '@dumbql/react';

<Query document={gql\`query { todos { id title } }\`}>
  {({ data, loading }) => (
    <div>
      {loading ? <p>Loading…</p> : data.todos.map(t => <p key={t.id}>{t.title}</p>)}
    </div>
  )}
</Query>`;
}
