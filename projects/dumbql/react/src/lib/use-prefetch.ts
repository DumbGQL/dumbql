import { useCallback } from 'react';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './provider';

export function usePrefetch<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
	document: DocumentNode | TypedDocumentNode<TData, TVariables>,
): (variables?: TVariables) => Promise<GraphQLResult<TData>> {
	const client = useClient();
	return useCallback(
		(variables?: TVariables) => client.query<TData, TVariables>(document, variables),
		[client, document],
	);
}
