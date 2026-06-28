import { inject } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import type { DocumentNode, TypedDocumentNode } from './gql';

export function query<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
	document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
	variables?: TVariables,
): Observable<GraphQLResult<TResponse>> {
	return defer(() => {
		const svc = inject(GraphqlService);
		return svc.query<TResponse, TVariables>(document, variables);
	});
}
