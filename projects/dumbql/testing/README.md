# @dumbql/testing

Mock GraphQL backend for unit testing DumbQL queries and mutations.

## Install

```bash
npm install @dumbql/testing
```

## Quick Start

```typescript
import { provideDumbqlTesting, MockGraphqlService } from '@dumbql/testing';

TestBed.configureTestingModule({
  providers: [provideDumbqlTesting()],
});

it('mocks a query', () => {
  const mock = TestBed.inject(MockGraphqlService);
  mock.when(
    gql`query Todos { todos { id } }`,
    { data: { todos: [{ id: '1' }] } },
  );

  const graphql = TestBed.inject(GraphqlService);
  graphql.query(gql`query Todos { todos { id } }`).subscribe(result => {
    expect(result.status).toBe('success');
  });
});
```

## API

| Export | Description |
|--------|-------------|
| `MockGraphqlService` | FIFO mock — `when(request, result)` registers responses |
| `provideDumbqlTesting()` | Provider array for `TestBed` |
| `MockedRequest` | `{ query: string; variables?: Record<string, unknown> }` |
| `MockedResponse` | `{ data?: T; errors?: { message: string }[] }` |

## Usage

Responses are consumed FIFO. If no mock is registered for a request, the service returns `{ status: 'error', error: 'No mock response configured' }`.

## Dependencies

`@angular/core`, `@dumbql/core`, `rxjs`
