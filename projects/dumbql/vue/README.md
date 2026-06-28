<p align="center">
  <img src="../../../public/logos/logo.png" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/vue</h1>

<p align="center"><b>Vue composables for @dumbql/client — useQuery, useMutation, useSubscription.</b></p>

---

## Features

- **`createDumbqlPlugin(client)`** — Vue plugin to provide DumbqlClient
- **`useQuery(document, variables?, options?)`** — reactive query composable
- **`useMutation(document)`** — mutation composable
- **`useSubscription(document, variables?, options?)`** — subscription composable
- **`useClient()`** — access DumbqlClient from anywhere
- **Reactive refs** — `data`, `loading`, `error` are Vue refs
- **SSR support** — works with Vue's `onServerPrefetch`

## Install

```bash
npm install @dumbql/vue @dumbql/client
```

## Quick Start

```vue
<script setup>
import { createDumbqlPlugin, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });
const plugin = createDumbqlPlugin(client);

// In your component:
const GET_TODOS = gql`query Todos { todos { id title } }`;
const { data, loading, error, refetch } = useQuery(GET_TODOS);
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error }}</p>
  <ul v-else>
    <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>
```

## API Overview

| Export | Description |
|--------|-------------|
| `createDumbqlPlugin(client)` | Vue plugin — installs the client globally |
| `useClient()` | Access `DumbqlClient` from composition API |
| `useQuery(doc, vars?, opts?)` | Reactive query → `{ data, loading, error, refetch }` |
| `useMutation(doc)` | Mutation → `{ data, loading, error, mutate }` |
| `useSubscription(doc, vars?, opts?)` | Subscription → `{ data, loading, error }` |

## Dependencies

`vue` (^3), `@dumbql/client`, `graphql`
