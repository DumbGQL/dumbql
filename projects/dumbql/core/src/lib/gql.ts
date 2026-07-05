import { parse, type DocumentNode, print } from 'graphql';

export function gql(strings: TemplateStringsArray, ...values: string[]): DocumentNode {
	return parse(String.raw(strings, ...values));
}

export { type DocumentNode, print };

export interface TypedDocumentNode<
	TResult = unknown,
	TVariables extends Record<string, unknown> = Record<string, unknown>
> extends DocumentNode {
	__resultType?: TResult;
	__variablesType?: TVariables;
}

/**
 * A pre-serialized GraphQL query string with phantom types for result and variables.
 * Created by `createTypedQuery()`. Skips runtime `parse()` — ideal for production bundles
 * when using @dumbql/codegen client preset.
 *
 * Usage:
 * ```typescript
 * import { createTypedQuery } from '@dumbql/core';
 *
 * const GetNotes = createTypedQuery<GetNotesResult, GetNotesVariables>(
 *   'query GetNotes { getNotes { id title } }'
 * );
 * ```
 */
export type TypedQueryString<
	TResult = unknown,
	TVariables extends Record<string, unknown> = Record<string, unknown>
> = string & {
	__resultType?: TResult;
	__variablesType?: TVariables;
};

/**
 * Creates a typed query string without runtime parsing.
 * Zero-cost abstraction — just returns the input string with type annotations.
 * Compatible with `GraphqlService.query()` and `GraphqlService.mutate()`.
 */
export function createTypedQuery<
	TResult,
	TVariables extends Record<string, unknown> = Record<string, unknown>
>(query: string): TypedQueryString<TResult, TVariables> {
	return query as TypedQueryString<TResult, TVariables>;
}
