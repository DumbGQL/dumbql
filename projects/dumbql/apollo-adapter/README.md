# @dumbql/apollo-adapter

Migration adapter from Apollo Client to DumbQL. Provides tools for incremental migration: `fromApolloCache()` wraps Apollo `InMemoryCache` into a DumbQL-compatible cache, and `createMigrationGuide()` maps Apollo APIs to their DumbQL equivalents.

## Usage

```ts
import { fromApolloCache, createMigrationGuide } from '@dumbql/apollo-adapter';

const adapter = fromApolloCache(apolloInMemoryCache);
const guide = createMigrationGuide();
```
