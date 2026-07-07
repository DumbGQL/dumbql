import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-errors',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './errors.html',
	styleUrl: './errors.scss',
})
export class DocsErrors {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/errors');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/errors/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'DumbqlError', description: 'Base error class for all DumbQL errors with code, timestamp, and optional context.', type: 'class' },
  	{ name: 'DumbqlError.code', description: 'Unique error code string.', type: 'property' },
  	{ name: 'DumbqlError.timestamp', description: 'ISO timestamp of when the error was created.', type: 'property' },
  	{ name: 'DumbqlError.context', description: 'Read-only context payload.', type: 'property' },
  	{ name: 'DumbqlError.toJSON()', description: 'Serializes error to a plain object.', type: 'method' },
  	{ name: 'GraphQLError', description: 'Error representing a GraphQL response error with locations, path, and extensions.', type: 'class' },
  	{ name: 'GraphQLError.locations', description: 'Line/column locations in the query.', type: 'property' },
  	{ name: 'GraphQLError.path', description: 'Path to the field that caused the error.', type: 'property' },
  	{ name: 'GraphQLError.extensions', description: 'Extended error metadata from the server.', type: 'property' },
  	{ name: 'GraphQLLocation', description: 'Location with line and column numbers in a GraphQL document.', type: 'interface' },
  	{ name: 'GraphQLLocation.line', description: 'Line number.', type: 'property' },
  	{ name: 'GraphQLLocation.column', description: 'Column number.', type: 'property' },
  	{ name: 'NetworkError', description: 'Error representing a transport-level failure (timeout, offline, HTTP error).', type: 'class' },
  	{ name: 'NetworkError.statusCode', description: 'HTTP status code if applicable.', type: 'property' },
  	{ name: 'NetworkError.statusText', description: 'HTTP status text if applicable.', type: 'property' },
  	{ name: 'NetworkErrorCode', description: 'Enum of network error codes: TIMEOUT, OFFLINE, HTTP_ERROR, DNS_ERROR, ABORTED, UNKNOWN.', type: 'enum' },
  	{ name: 'CacheError', description: 'Error representing a cache operation failure (miss, serialization, GC, persistence).', type: 'class' },
  	{ name: 'CacheErrorCode', description: 'Enum of cache error codes: MISS, SERIALIZATION, GC, PERSISTENCE, INVALIDATION.', type: 'enum' },
  	{ name: 'ValidationError', description: 'Error representing a query or response validation failure.', type: 'class' },
  	{ name: 'ValidationErrorCode', description: 'Enum of validation error codes: MISSING_VARIABLES, INVALID_QUERY, TYPE_MISMATCH, MALFORMED_RESPONSE.', type: 'enum' },
  	{ name: 'ErrorHandler', description: 'Configurable error handler with filter-based routing and fallback throw behavior.', type: 'class' },
  	{ name: 'ErrorHandler.on(filter, handler)', description: 'Registers a handler for matching error codes or filter functions. Returns this for chaining.', type: 'method' },
  	{ name: 'ErrorHandler.handle(error)', description: 'Processes an error through registered handlers. Returns true if handled.', type: 'method' },
  	{ name: 'ErrorHandler.reset()', description: 'Clears all registered handlers.', type: 'method' },
  	{ name: 'ErrorFilter', description: 'Type alias for error filter function: (error: DumbqlError) => boolean.', type: 'type' },
  	{ name: 'ErrorHandlerFn', description: 'Type alias for error handler function returning boolean, void, or Promise.', type: 'type' },
  	{ name: 'ErrorHandlerConfig', description: 'Configuration for ErrorHandler.', type: 'interface' },
  	{ name: 'ErrorHandlerConfig.throwUnhandled', description: 'Whether to throw errors not handled by any filter.', type: 'property', default: 'true' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'overview', title: 'Overview' },
  	{ id: 'error-types', title: 'Error Types' },
  	{ id: 'handling', title: 'Handling Errors' },
  	{ id: 'discrimination', title: 'Discrimination' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly useErrorType = `import { GraphQLError } from 'graphql';
import { isGraphQLError, isClientError, isNetworkError } from '@dumbql/errors';

try {
  const data = await client.query({ query: MY_QUERY });
} catch (err: unknown) {
  if (isGraphQLError(err)) {
    // GraphQL response error with extensions, path, etc.
    console.error(err.extensions?.code);
  } else if (isNetworkError(err)) {
    // Fetch/WebSocket failure
    console.error('Network failure:', err.message);
  } else if (isClientError(err)) {
    // Validation / usage error from the client library
    console.error('Client error:', err.message);
  }
}`;

  protected readonly userFacingCode = `import { getUserFacingMessage } from '@dumbql/errors';

function ErrorDisplay({ error }: { error: unknown }) {
  return <div className="error-banner">{getUserFacingMessage(error)}</div>;
}`;

  protected readonly discriminationCode = `import { isGraphQLError } from '@dumbql/errors';

// TypeScript type guard
if (isGraphQLError(err)) {
  // err is narrowed to GraphQLError<{ code: string }>
  console.log(err.extensions.code);
}`;
}
