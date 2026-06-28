<p align="center">
  <img src="../../../public/logos/logo.png" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/react</h1>

<p align="center"><b>React bindings for @dumbql/client — hooks, render‑prop components, cache integration.</b></p>

---

## Install

```bash
npm install @dumbql/react @dumbql/client @dumbql/cache
```

## Quick Start

```tsx
import { DumbqlProvider, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

const GET_TODOS = gql`query Todos { todos { id title } }`;

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
}
```

## API Overview

### Context & Providers

| Export | Description |
|--------|-------------|
| `DumbqlProvider` | Provides `DumbqlClient` and optional `CacheService` to the component tree |
| `useClient()` | Returns `DumbqlClient` from context |
| `useCache()` | Returns `CacheService \| null` from context |

### Hooks

| Export | Description |
|--------|-------------|
| `useQuery(doc, vars?)` | `{ data, loading, error, refetch }` |
| `useMutation(doc)` | `{ data, loading, error, mutate }` |
| `useSubscription(doc, vars?, opts?)` | `{ data, loading, error }` |

### Render‑prop Components

| Export | Description |
|--------|-------------|
| `<Query document variables>{…}</Query>` | Render prop with `UseQueryResult` |
| `<Mutation document>{…}</Mutation>` | Render prop with `(mutate, result)` |
| `<Subscription document variables wsEndpoint>{…}</Subscription>` | Render prop with `UseSubscriptionResult` |

### Render‑prop Example

```tsx
import { Query, Mutation, gql } from '@dumbql/react';

const ADD_TODO = gql`mutation AddTodo($title: String!) { addTodo(title: $title) { id } }`;

function TodosPage() {
  return (
    <Query document={gql`query { todos { id title } }`}>
      {({ data, loading }) => (
        <div>
          {loading ? <p>Loading…</p> : data.todos.map(t => <p key={t.id}>{t.title}</p>)}
          <Mutation document={ADD_TODO}>
            {(mutate) => (
              <button onClick={() => mutate({ title: 'New' })}>Add</button>
            )}
          </Mutation>
        </div>
      )}
    </Query>
  );
}
```

## Dependencies

`react` (^18 / ^19), `@dumbql/client`, `@dumbql/cache`, `graphql`
