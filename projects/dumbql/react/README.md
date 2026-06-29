<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/react/assets/logo.svg" alt="DumbQL React" width="160"/>
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

## Hooks

### useQuery

```tsx
const { data, loading, error, errorCode, networkStatus, called, refetch, fetchMore } = useQuery(
  document,
  {
    variables,
    pollInterval,       // auto-polling in ms
    skip,               // skip initial fetch
    onCompleted,        // (data) => void
    onError,            // (error, errorCode?) => void
    fetchPolicy,        // 'cache-first' | 'network-only' | 'no-cache'
  },
);
```

**Result fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | `TData \| null` | Response data |
| `loading` | `boolean` | True during initial fetch or refetch |
| `error` | `string \| null` | Error message |
| `errorCode` | `ErrorCode \| undefined` | `'NO_DATA' \| 'GRAPHQL_ERROR' \| 'NETWORK_ERROR'` |
| `networkStatus` | `NetworkStatus` | `'loading' \| 'ready' \| 'error' \| 'refetching' \| 'poll'` |
| `called` | `boolean` | True after first execution |
| `refetch` | `(vars?) => Promise<GraphQLResult<T>>` | Re-fetch with optional new variables |
| `fetchMore` | `(merge, vars?) => Promise<GraphQLResult<T>>` | Fetch more data and merge with existing |

### useMutation

```tsx
const { data, loading, error, errorCode, called, mutate } = useMutation(
  document,
  {
    variables,
    onCompleted,   // (data) => void
    onError,       // (error, errorCode?) => void
    update,        // (cache, result) => void — update cache after success
  },
);

// Call mutate imperatively:
mutate(variables);
```

### useSubscription

```tsx
const { data, loading, error, errorCode } = useSubscription(
  document,
  {
    variables,
    wsEndpoint,       // default: derived from client endpoint
    shouldSubscribe,  // default: true
    onNext,           // (data) => void
    onError,          // (error, errorCode?) => void
    onComplete,       // () => void
  },
);
```

### useLiveQuery

Real-time query: initial HTTP fetch + WebSocket subscription for updates.

```tsx
const { data, loading, error, errorCode } = useLiveQuery(
  document,
  {
    variables,
    wsEndpoint,       // default: derived from client endpoint
    shouldSubscribe,  // default: true
    onCompleted,      // (data) => void
    onError,          // (error, errorCode?) => void
  },
);
```

## Render-prop Components

| Export | Description |
|--------|-------------|
| `<Query document variables pollInterval skip>{…}</Query>` | Render prop with `UseQueryResult` |
| `<Mutation document variables>{…}</Mutation>` | Render prop with `(mutate, result)` |
| `<Subscription document variables wsEndpoint>{…}</Subscription>` | Render prop with `UseSubscriptionResult` |

### Render-prop Example

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
