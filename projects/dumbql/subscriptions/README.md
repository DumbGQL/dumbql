<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/core/assets/logo.svg" alt="DumbQL" width="160"/>
</p>

## Install

```bash
npm install @dumbql/subscriptions
```

## Usage (framework‑agnostic)

```typescript
import { GraphqlSubscription } from '@dumbql/subscriptions';
import { print, gql } from 'graphql';

const subs = new GraphqlSubscription('/graphql');

const unsubscribe = subs.subscribe(
  print(gql`subscription { messageAdded { content } }`),
  {},
  {
    next: (data) => console.log('new message', data),
    error: (err) => console.error('sub error', err),
    complete: () => console.log('sub complete'),
  },
);

// later: unsubscribe();
```

## Usage (Angular)

```typescript
import { Component, inject } from '@angular/core';
import { GraphqlSubscriptionService } from '@dumbql/subscriptions/angular';
import { gql } from '@dumbql/core';

@Component({})
class MessagesComponent {
  private subs = inject(GraphqlSubscriptionService);
  messages$ = this.subs.subscribe<{ content: string }>(
    gql`subscription { messageAdded { content } }`,
  );
}
```

Or standalone:

```typescript
import { subscribe } from '@dumbql/subscriptions/angular';

@Component({})
class MessagesComponent {
  messages$ = subscribe<{ content: string }>(
    gql`subscription { messageAdded { content } }`,
  );
}
```

## Angular Provider

```typescript
import { provideDumbqlSubscriptions } from '@dumbql/subscriptions/angular';

export const appConfig = {
  providers: [
    provideDumbqlSubscriptions({
      wsUrl: 'ws://localhost:4000/graphql',
      connectionParams: () => ({ authorization: `Bearer ${getToken()}` }),
    }),
  ],
};
```

## API

### `@dumbql/subscriptions` (agnostic)

| Export | Description |
|--------|-------------|
| `GraphqlSubscription` | Core WebSocket subscription class |

### `@dumbql/subscriptions/angular` (Angular)

| Export | Description |
|--------|-------------|
| `GraphqlSubscriptionService` | Injectable WebSocket subscription manager |
| `subscribe(document, variables?)` | Standalone function (injection‑free) |
| `provideDumbqlSubscriptions(config?)` | Provider for subscription config |
| `SubscriptionsConfig` | Configuration interface |
| `SUBSCRIPTIONS_CONFIG` | Injection token |

## Dependencies

- Core (`@dumbql/subscriptions`): `@dumbql/core`  
- Angular (`@dumbql/subscriptions/angular`): additionally `@angular/core`, `rxjs`
