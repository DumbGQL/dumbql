import { InjectionToken } from '@angular/core';

export interface GraphqlCacheLike {
	merge(entity: { __typename: string; id: string; [key: string]: unknown }): void;
	readLocal(key: string): unknown;
	writeLocalWithTypes<T>(key: string, value: T, types: Set<string>): void;
	clearLocalStateByTypes(types: string[]): void;
	setTypePolicies(policies: Record<string, { keyFields?: string[]; merge?: unknown }>): void;
	applyOptimistic(update: { id: string; entities: { __typename: string; id: string }[] }): string;
	commitOptimistic(id: string): void;
	rollbackOptimistic(id: string): void;
}

export const GRAPHQL_CACHE = new InjectionToken<GraphqlCacheLike>('GRAPHQL_CACHE');
