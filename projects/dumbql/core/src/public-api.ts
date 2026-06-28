export { provideGraphql, type DumbqlConfig, type GraphqlConfig } from './lib/graphql-config';
export type {
  GraphqlCoreConfig,
  SubscriptionsConfig,
  CacheConfig,
  PersistedQueriesConfig,
  UploadConfig,
  DebugConfig,
  PaginationConfig,
  SsrConfig,
  TestingConfig,
  CodegenConfig,
} from './lib/dumbql-config';
export { DumbqlConfigService, provideDumbql } from './lib/config.service';
export { DUMBQL_CONFIG, GRAPHQL_CONFIG } from './lib/dumbql-config';
export type { OnErrorServiceConfig, SchemaConfig, DumbqlPlugin } from './lib/dumbql-config';
export { GraphqlService, type GraphQLResult, type GraphQLResponse } from './lib/graphql.service';
export { gql, print } from './lib/gql';
export type { DocumentNode, TypedDocumentNode } from './lib/gql';
export { query, type QueryHandle } from './lib/query';
export { GraphqlEndpoint, provideEndpoint, injectEndpoint, type MutateEndpointOptions } from './lib/endpoint';
export { mutate, type MutateOptions } from './lib/mutate';
export { refetch } from './lib/refetch';
export { poll } from './lib/poll';
export { isSuccess, isError, unwrap, unwrapOrThrow, mapResult, hasPartialErrors, getGraphQLErrors, getNetworkError } from './lib/helpers';
export {
  GqlPipe,
  GraphqlDataPipe,
  GraphqlErrorPipe,
  GraphqlStatusPipe,
  GraphqlIsSuccessPipe,
  GraphqlIsErrorPipe,
  GraphqlUnwrapPipe,
} from './lib/pipes';

export { DumbqlQueryDirective, DumbqlAutoFetchDirective } from './lib/directives';
export type { DumbqlQueryContext } from './lib/directives';
export { applyMiddleware, authMiddleware, devAuthMiddleware, loggingMiddleware, hasFiles } from './lib/middleware';

export type { GraphqlRequestContext, GraphqlMiddlewareNext, GraphqlMiddleware } from './lib/middleware';

export {
  DevtoolsService,
  provideDevtools,
  devtoolsMiddleware,
  type DevtoolsConfig,
  type SchemaDownloadConfig,
} from './lib/devtools';

export { SchemaService, provideSchemaFetch, type SchemaServiceConfig } from './lib/schema.service';

export { provideDumbqlRouter, guardedRoute, canActivateWithGuards, type DumbqlRouteGuard } from './lib/dumbql-router';

export { mutationCachePolicy, provideAutoRefetch, AutoRefetchService } from './lib/auto-refetch';
export { cacheMiddleware } from './lib/cache-middleware';

export { SCHEMA_SERVICE_CONFIG } from './lib/schema.service';

export { DEVTOLS_CONFIG } from './lib/devtools';

export { makeVar, ReactiveVar } from './lib/reactive-vars';
export { clientDirectiveMiddleware } from './lib/client-directive';
export {
  streamingMiddleware,
  applyPatch,
  applyStreamItems,
  parseMultipartResponse,
  type IncrementalPayload,
  type IncrementalResponse,
} from './lib/streaming';
