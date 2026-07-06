import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-opentelemetry',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './opentelemetry.html',
	styleUrl: './opentelemetry.scss',
})
export class DocsOpentelemetry {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/opentelemetry');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/opentelemetry/src';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'MinimalTracer', description: 'Minimal OpenTelemetry-compatible tracer with configurable service name and exporter. Zero external dependencies.', type: 'class' },
  	{ name: 'MinimalTracer.constructor(config?)', description: 'Creates a tracer with optional exporter, sampleRate, serviceName.', type: 'constructor', default: 'TracerConfig = {}' },
  	{ name: 'MinimalTracer.startSpan(name, options?)', description: 'Creates and returns a new Span with optional parent context and attributes.', type: 'method' },
  	{ name: 'MinimalTracer.startSpanSync(name, fn, options?)', description: 'Creates a span, runs a synchronous function, ends span on success or error.', type: 'method' },
  	{ name: 'MinimalTracer.startSpanAsync(name, fn, options?)', description: 'Creates a span, runs an async function, ends span on success or error.', type: 'method' },
  	{ name: 'TracerConfig', description: 'Configuration for MinimalTracer.', type: 'interface' },
  	{ name: 'TracerConfig.exporter', description: 'Custom SpanExporter instance.', type: 'property', default: 'consoleExporter({ pretty: true })' },
  	{ name: 'TracerConfig.sampleRate', description: 'Probability (0-1) of sampling a trace.', type: 'property', default: '1' },
  	{ name: 'TracerConfig.serviceName', description: 'Service name for identifying spans.', type: 'property', default: 'dumbql' },
  	{ name: 'getTracer()', description: 'Returns the global MinimalTracer instance, creating a default one if none set.', type: 'function' },
  	{ name: 'setTracer(tracer)', description: 'Sets the global tracer instance used by all OTel middleware.', type: 'function' },
  	{ name: 'SpanContext', description: 'W3C trace context with traceId, spanId, flags, and remote flag.', type: 'interface' },
  	{ name: 'SpanContext.traceId', description: '32-hex-character trace ID.', type: 'property' },
  	{ name: 'SpanContext.spanId', description: '16-hex-character span ID.', type: 'property' },
  	{ name: 'SpanContext.traceFlags', description: 'W3C trace flags (sampled bit = 1).', type: 'property' },
  	{ name: 'SpanContext.traceParent', description: 'Full traceparent header string.', type: 'property' },
  	{ name: 'SpanContext.isRemote', description: 'Whether this context was propagated from a remote service.', type: 'property' },
  	{ name: 'Span', description: 'OpenTelemetry-compatible span interface.', type: 'interface' },
  	{ name: 'Span.setAttribute(key, value)', description: 'Sets a single attribute on the span.', type: 'method' },
  	{ name: 'Span.setAttributes(attrs)', description: 'Sets multiple attributes at once.', type: 'method' },
  	{ name: 'Span.setStatus(status)', description: 'Sets the span status (OK / ERROR / UNSET).', type: 'method' },
  	{ name: 'Span.addEvent(name, attributes?)', description: 'Records a named event with optional attributes.', type: 'method' },
  	{ name: 'Span.end()', description: 'Ends the span and exports it via the registered exporter.', type: 'method' },
  	{ name: 'Span.isRecording()', description: 'Returns whether the span is still recording.', type: 'method' },
  	{ name: 'SpanAttributes', description: 'String-keyed map of attribute values (string, number, boolean, or undefined).', type: 'type' },
  	{ name: 'SpanStatus', description: 'Span status with code and optional message.', type: 'interface' },
  	{ name: 'SpanStatus.code', description: 'Status code: OK, ERROR, or UNSET.', type: 'property' },
  	{ name: 'SpanStatus.message', description: 'Optional error description.', type: 'property' },
  	{ name: 'SpanExporter', description: 'Interface for exporting completed spans.', type: 'interface' },
  	{ name: 'SpanExporter.export(span)', description: 'Exports a single ReadonlySpan.', type: 'method' },
  	{ name: 'ReadonlySpan', description: 'Immutable snapshot of an ended span.', type: 'interface' },
  	{ name: 'ReadonlySpan.name', description: 'Span operation name.', type: 'property' },
  	{ name: 'ReadonlySpan.spanContext', description: 'Span context with trace/span IDs.', type: 'property' },
  	{ name: 'ReadonlySpan.parentSpanId', description: 'Parent span ID if any.', type: 'property' },
  	{ name: 'ReadonlySpan.status', description: 'Final span status.', type: 'property' },
  	{ name: 'ReadonlySpan.attributes', description: 'Span attributes at end time.', type: 'property' },
  	{ name: 'ReadonlySpan.events', description: 'Recorded span events.', type: 'property' },
  	{ name: 'ReadonlySpan.startTime', description: 'Span start timestamp in ms.', type: 'property' },
  	{ name: 'ReadonlySpan.endTime', description: 'Span end timestamp in ms.', type: 'property' },
  	{ name: 'ReadonlySpan.duration', description: 'Computed duration in ms.', type: 'property' },
  	{ name: 'otelMiddleware(config?)', description: 'Server-side middleware that captures incoming trace context from traceparent headers.', type: 'function' },
  	{ name: 'otelClientMiddleware(config?)', description: 'Client-side middleware that propagates trace context to outgoing requests.', type: 'function' },
  	{ name: 'OtelMiddlewareConfig', description: 'Configuration for OTel middleware functions.', type: 'interface' },
  	{ name: 'OtelMiddlewareConfig.tracer', description: 'Custom tracer instance (defaults to global).', type: 'property', default: 'getTracer()' },
  	{ name: 'OtelMiddlewareConfig.attributes', description: 'Static attributes added to every span.', type: 'property', default: '—' },
  	{ name: 'OtelMiddlewareConfig.parentContext', description: 'Parent SpanContext for trace propagation.', type: 'property', default: '—' },
  	{ name: 'OtelMiddlewareConfig.maxQueryLength', description: 'Max query length in span attributes (0 to skip).', type: 'property', default: '500' },
  	{ name: 'consoleExporter(options?)', description: 'Built-in exporter that prints spans to console with optional pretty-print.', type: 'function' },
  	{ name: 'ConsoleExporterOptions', description: 'Options for console exporter.', type: 'interface' },
  	{ name: 'ConsoleExporterOptions.pretty', description: 'Use console.groupCollapsed for grouped output.', type: 'property', default: 'false' },
  	{ name: 'parseTraceParent(header)', description: 'Parses a W3C traceparent header string into its component fields.', type: 'function' },
  	{ name: 'formatTraceParent(traceId, spanId, traceFlags)', description: 'Formats trace context into a W3C traceparent header string.', type: 'function' },
  	{ name: 'generateTraceId()', description: 'Generates a random 32-hex-character trace ID.', type: 'function' },
  	{ name: 'generateSpanId()', description: 'Generates a random 16-hex-character span ID.', type: 'function' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'setup', title: 'Setup' },
  	{ id: 'middleware', title: 'OTel Middleware' },
  	{ id: 'trace-context', title: 'Trace Context (W3C)' },
  	{ id: 'exporters', title: 'Exporters' },
  	{ id: 'angular', title: 'Angular Integration' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly setupCode = `import { createClient } from '@dumbql/client';
import { MinimalTracer, setTracer, otelMiddleware } from '@dumbql/opentelemetry';

const tracer = new MinimalTracer({ serviceName: 'my-app' });
setTracer(tracer);

const client = createClient({
  endpoint: '/graphql',
  middleware: [otelMiddleware()],
});`;

  protected readonly middlewareCode = `import { otelMiddleware, otelClientMiddleware } from '@dumbql/opentelemetry';

// Server-side: capture incoming trace context
const serverMiddleware = otelMiddleware({
  serviceName: 'api',
});

// Client-side: propagate trace context to outgoing requests
const clientMiddleware = otelClientMiddleware({
  propagateHeaders: true,
});`;

  protected readonly traceContextCode = `import {
  parseTraceParent,
  formatTraceParent,
  generateTraceId,
  generateSpanId,
} from '@dumbql/opentelemetry';

// Generate a new trace
const traceId = generateTraceId();
const spanId = generateSpanId();
const traceParent = formatTraceParent({ traceId, spanId, traceFlags: 1 });
// → "00-<traceId>-<spanId>-01"

// Parse an incoming traceparent header
const context = parseTraceParent(traceParent);
// → { traceId, spanId, traceFlags, version }`;

  protected readonly exporterCode = `import { consoleExporter } from '@dumbql/opentelemetry';

const exporter = consoleExporter({
  prettyPrint: true,
  includeAttributes: true,
  includeTiming: true,
});

// Register with tracer
const tracer = new MinimalTracer({
  serviceName: 'my-app',
  exporter,
});`;

  protected readonly angularCode = `import { provideDumbql } from '@dumbql/core';
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
};`;
}
