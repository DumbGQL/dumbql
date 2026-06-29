import { type ReactNode } from 'react';
import { useSubscription, type UseSubscriptionOptions, type UseSubscriptionResult } from './use-subscription';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';

export interface SubscriptionProps<TData, TVariables extends Record<string, unknown>> {
  document: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: Record<string, unknown>;
  wsEndpoint?: string;
  shouldSubscribe?: boolean;
  children: (result: UseSubscriptionResult<TData>) => ReactNode;
}

export function Subscription<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  document,
  variables,
  wsEndpoint,
  shouldSubscribe,
  children,
}: SubscriptionProps<TData, TVariables>): ReactNode {
  const options: UseSubscriptionOptions<TData> = {
    variables,
    wsEndpoint,
    shouldSubscribe,
  };
  const result = useSubscription<TData, TVariables>(document, options);
  return children(result);
}
