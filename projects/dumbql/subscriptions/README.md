# @dumbql/subscriptions

WebSocket GraphQL subscriptions via the `graphql-transport-ws` protocol.

## Install

```bash
npm install @dumbql/subscriptions
```

## Quick Start

```typescript
import { GraphqlSubscriptionService } from '@dumbql/subscriptions';
import { gql } from '@dumbql/core';

class MyComponent {
  private subs = inject(GraphqlSubscriptionService);
  messages$ = this.subs.subscribe<{ content: string }>(
    gql`subscription { messageAdded { content } }`,
  );
}
```

Or standalone:

```typescript
import { subscribe } from '@dumbql/subscriptions';

@Component({})
class MyComponent {
  messages$ = subscribe<{ content: string }>(
    gql`subscription { messageAdded { content } }`,
  );
}
```

## API

| Export | Description |
|--------|-------------|
| `GraphqlSubscriptionService` | Injectable WebSocket subscription manager |
| `subscribe(document, variables?)` | Standalone function (injection‑free) |

## Configuration

The subscription endpoint is derived from `DumbqlConfig.endpoint` by replacing `http` → `ws`.

## Dependencies

`@angular/core`, `@dumbql/core`, `rxjs`
