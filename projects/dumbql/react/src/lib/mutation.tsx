import { type ReactNode } from 'react';
import { useMutation, type UseMutationOptions, type UseMutationResult } from './use-mutation';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';
import type { GraphQLResult } from '@dumbql/client';

export interface MutationProps<TData, TVariables extends Record<string, unknown>> {
  document: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  update?: (result: GraphQLResult<TData>) => void;
  children: (mutate: UseMutationResult<TData, TVariables>['mutate'], result: UseMutationResult<TData, TVariables>) => ReactNode;
}

export function Mutation<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  document,
  variables,
  update,
  children,
}: MutationProps<TData, TVariables>): ReactNode {
  const options: UseMutationOptions<TData, TVariables> = {};
  if (variables !== undefined) options.variables = variables;
  if (update !== undefined) {
    options.update = (cache, result) => {
      update(result);
    };
  }

  const result = useMutation<TData, TVariables>(document, options);
  return children(result.mutate, result);
}
