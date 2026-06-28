import { type ReactNode } from 'react';
import { useMutation, type UseMutationResult } from './use-mutation';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';

export interface MutationProps<TData, TVariables extends Record<string, unknown>> {
  document: DocumentNode | TypedDocumentNode<TData, TVariables>;
  children: (mutate: UseMutationResult<TData, TVariables>['mutate'], result: UseMutationResult<TData, TVariables>) => ReactNode;
}

export function Mutation<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  document,
  children,
}: MutationProps<TData, TVariables>): ReactNode {
  const result = useMutation<TData, TVariables>(document);
  return children(result.mutate, result);
}
