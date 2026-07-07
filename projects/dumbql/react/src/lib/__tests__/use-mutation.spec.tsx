import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { CacheStore } from '@dumbql/cache';
import { DumbqlClient } from '@dumbql/client';
import { useMutation } from '../use-mutation';
import { DumbqlProvider } from '../provider';

function wrapper(client: DumbqlClient, cache?: CacheStore) {
  return ({ children }: { children: React.ReactNode }) =>
    <DumbqlProvider client={client} cache={cache}>{children}</DumbqlProvider>;
}

describe('useMutation optimistic', () => {
  it('calls optimistic callback with cache before mutation', async () => {
    const cache = { commitOptimistic: vi.fn(), rollbackOptimistic: vi.fn() } as unknown as CacheStore;
    const client = new DumbqlClient({ endpoint: '/graphql' });
    client.mutate = vi.fn().mockResolvedValue({ status: 'success', data: { x: 1 } });

    const optimistic = vi.fn().mockReturnValue('opt-1');
    const { result } = renderHook(
      () => useMutation('mutation { x }' as any, { optimistic }),
      { wrapper: wrapper(client, cache) },
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(optimistic).toHaveBeenCalledWith(cache);
  });

  it('commits optimistic on success', async () => {
    const cache = { commitOptimistic: vi.fn(), rollbackOptimistic: vi.fn() } as unknown as CacheStore;
    const client = new DumbqlClient({ endpoint: '/graphql' });
    client.mutate = vi.fn().mockResolvedValue({ status: 'success', data: { x: 1 } });

    const { result } = renderHook(
      () => useMutation('mutation { x }' as any, { optimistic: () => 'opt-1' }),
      { wrapper: wrapper(client, cache) },
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(cache.commitOptimistic).toHaveBeenCalledWith('opt-1');
    expect(cache.rollbackOptimistic).not.toHaveBeenCalled();
  });

  it('rolls back optimistic on error', async () => {
    const cache = { commitOptimistic: vi.fn(), rollbackOptimistic: vi.fn() } as unknown as CacheStore;
    const client = new DumbqlClient({ endpoint: '/graphql' });
    client.mutate = vi.fn().mockResolvedValue({ status: 'error', error: 'fail', errorCode: 'GRAPHQL_ERROR' });

    const { result } = renderHook(
      () => useMutation('mutation { x }' as any, { optimistic: () => 'opt-2' }),
      { wrapper: wrapper(client, cache) },
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(cache.rollbackOptimistic).toHaveBeenCalledWith('opt-2');
    expect(cache.commitOptimistic).not.toHaveBeenCalled();
  });

  it('does nothing with optimistic when no cache', async () => {
    const client = new DumbqlClient({ endpoint: '/graphql' });
    client.mutate = vi.fn().mockResolvedValue({ status: 'success', data: { x: 1 } });

    const optimistic = vi.fn().mockReturnValue('opt-1');
    const { result } = renderHook(
      () => useMutation('mutation { x }' as any, { optimistic }),
      { wrapper: wrapper(client) },
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(optimistic).not.toHaveBeenCalled();
  });
});
