# @dumbql/opentelemetry

W3C Trace Context propagation and OpenTelemetry-compatible tracing for DumbQL GraphQL clients — with zero external dependencies.

## Installation

```bash
npm install @dumbql/opentelemetry
```

## Quick Start

```typescript
import { createClient } from '@dumbql/client';
import { MinimalTracer, setTracer, otelMiddleware } from '@dumbql/opentelemetry';

const tracer = new MinimalTracer({ serviceName: 'my-app' });
setTracer(tracer);

const client = createClient({
  endpoint: '/graphql',
  middleware: [otelMiddleware()],
});
```

## Features

- **MinimalTracer** — Lightweight OpenTelemetry-compatible tracer with span lifecycle
- **otelMiddleware** — Capture incoming trace context from `traceparent` headers
- **otelClientMiddleware** — Propagate trace context to outgoing requests
- **W3C Trace Context** — Full `traceparent` header parsing and formatting
- **Console exporter** — Pretty-printed span output for development
- **Angular integration** — Provider-based setup with `provideDumbqlTelemetry()`

## API

### `MinimalTracer`

```typescript
const tracer = new MinimalTracer({
  serviceName: 'my-app',
  exporter: consoleExporter({ prettyPrint: true }),
});

const span = tracer.startSpan('graphql-request');
span.setAttribute('operation', 'getUser');
span.end();
```

### `otelMiddleware(config?)`

Server-side middleware that captures incoming trace context:

```typescript
const middleware = otelMiddleware({
  serviceName: 'api',
  propagateHeaders: true,
});
```

### `otelClientMiddleware(config?)`

Client-side middleware that propagates trace context to outgoing requests:

```typescript
const middleware = otelClientMiddleware({
  propagateHeaders: true,
});
```

### Trace Context Utilities

```typescript
import { parseTraceParent, formatTraceParent, generateTraceId, generateSpanId } from '@dumbql/opentelemetry';

const traceId = generateTraceId();
const spanId = generateSpanId();
const header = formatTraceParent({ traceId, spanId, traceFlags: 1 });

const context = parseTraceParent(header);
```

### Angular Integration

```typescript
import { provideDumbql } from '@dumbql/core';
import { provideDumbqlTelemetry } from '@dumbql/opentelemetry/angular';

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideDumbql({ endpoint: '/graphql' }),
    provideDumbqlTelemetry({
      serviceName: 'my-angular-app',
      exporter: 'console',
    }),
  ],
};
```

## License

MIT
