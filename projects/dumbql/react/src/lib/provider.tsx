import { createContext, useContext, type ReactNode } from 'react';
import type { DumbqlClient } from '@dumbql/client';
import type { CacheStore } from '@dumbql/cache';

const DumbqlContext = createContext<DumbqlClient | null>(null);
const CacheContext = createContext<CacheStore | null>(null);

export interface DumbqlProviderProps {
  client: DumbqlClient;
  cache?: CacheStore;
  children: ReactNode;
}

export function DumbqlProvider({ client, cache, children }: DumbqlProviderProps): ReactNode {
  return (
    <DumbqlContext.Provider value={client}>
      <CacheContext.Provider value={cache ?? null}>
        {children}
      </CacheContext.Provider>
    </DumbqlContext.Provider>
  );
}

export function useClient(): DumbqlClient {
  const client = useContext(DumbqlContext);
  if (!client) {
    throw new Error(
      'No DumbqlClient found in context. Wrap your app with <DumbqlProvider client={client}>',
    );
  }
  return client;
}

export function useCache(): CacheStore | null {
  return useContext(CacheContext);
}
