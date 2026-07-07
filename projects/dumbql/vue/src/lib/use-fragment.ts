import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';
import { useClient } from './plugin';

interface FragmentIdentifier {
  __typename: string;
  id?: string;
}

export interface UseFragmentResult<TData> {
  data: TData | null;
  complete: boolean;
}

export function useFragment<TData extends Record<string, unknown>>(
  _fragment: DocumentNode | TypedDocumentNode<TData>,
  identifier: FragmentIdentifier | null,
): UseFragmentResult<TData> {
  const client = useClient();

  if (!identifier) return { data: null, complete: false };

  const cache = client.getCacheService();
  const id = identifier.id ?? '';
  const entity = cache?.query(identifier.__typename, id);
  if (!entity) return { data: null, complete: false };

  return { data: entity as unknown as TData, complete: true };
}
