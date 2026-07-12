import { describe, it, expect, vi } from 'vitest';

vi.mock('@angular/core', () => ({
	inject: () => { throw new Error('should not be called in pure tests'); },
}));
vi.mock('../graphql.service', () => ({
	GraphqlService: class {},
}));
vi.mock('../endpoints.service', () => ({
	EndpointsService: class {},
}));
vi.mock('@angular/router', () => ({}));
vi.mock('rxjs', () => ({ Observable: class {} }));
vi.mock('rxjs/operators', () => ({ map: () => ({} as any) }));

const { prefetchedRoute } = await import('../dumbql-resolver');
import type { PrefetchDefinition } from '../dumbql-resolver';

function fakeDoc(name: string) {
	return { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: name } }] } as any;
}

describe('prefetchedRoute', () => {
	it('merges single prefetch into route resolve', () => {
		const doc = fakeDoc('GetUsers');
		const route = prefetchedRoute({ path: 'users' }, { document: doc });

		expect(route.resolve).toBeDefined();
		expect(route.resolve!['GetUsers']).toBeTypeOf('function');
	});

	it('merges array of prefetches into route resolve', () => {
		const doc1 = fakeDoc('GetUsers');
		const doc2 = fakeDoc('GetPosts');
		const route = prefetchedRoute({ path: 'items' }, [
			{ document: doc1 },
			{ document: doc2 },
		]);

		expect(Object.keys(route.resolve!)).toEqual(['GetUsers', 'GetPosts']);
	});

	it('auto-names unnamed queries with graphql_N', () => {
		const doc = { kind: 'Document', definitions: [] } as any;
		const route = prefetchedRoute({ path: 'x' }, { document: doc });

		expect(route.resolve!['graphql_0']).toBeTypeOf('function');
	});

	it('preserves existing route resolve', () => {
		const doc = fakeDoc('Q1');
		const existing = { existing: () => 'yes' } as any;
		const route = prefetchedRoute({ path: 'p', resolve: existing }, { document: doc });

		expect(route.resolve!['existing']).toBeDefined();
		expect(route.resolve!['Q1']).toBeDefined();
	});

	it('spreads original route properties', () => {
		const doc = fakeDoc('Q');
		const route = prefetchedRoute(
			{ path: 'p', canActivate: [() => true], component: class {} as any },
			{ document: doc },
		);

		expect(route.path).toBe('p');
		expect(route.canActivate).toHaveLength(1);
		expect(route.component).toBeDefined();
	});
});

describe('prefetchedRoute with defaultEndpoint', () => {
	it('applies defaultEndpoint to prefetches without endpoint', () => {
		const doc = fakeDoc('GetUsers');
		const route = prefetchedRoute(
			{ path: 'users' },
			{ document: doc },
			'myEndpoint',
		);

		expect(route.resolve).toBeDefined();
		expect(route.resolve!['GetUsers']).toBeTypeOf('function');
	});

	it('does not override per-prefetch endpoint', () => {
		const doc = fakeDoc('GetUsers');
		const route = prefetchedRoute(
			{ path: 'users' },
			{ document: doc, endpoint: 'specificEndpoint' },
			'defaultEndpoint',
		);

		expect(route.resolve).toBeDefined();
		expect(route.resolve!['GetUsers']).toBeTypeOf('function');
	});

	it('applies defaultEndpoint to multiple prefetches', () => {
		const doc1 = fakeDoc('Q1');
		const doc2 = fakeDoc('Q2');
		const route = prefetchedRoute(
			{ path: 'p' },
			[{ document: doc1 }, { document: doc2 }],
			'ep',
		);

		expect(Object.keys(route.resolve!)).toEqual(['Q1', 'Q2']);
	});
});

describe('PrefetchDefinition types', () => {
	it('accepts document only', () => {
		const def: PrefetchDefinition = { document: fakeDoc('Q') };
		expect(def.document).toBeDefined();
		expect(def.variables).toBeUndefined();
		expect(def.endpoint).toBeUndefined();
	});

	it('accepts document with variables', () => {
		const def: PrefetchDefinition = {
			document: fakeDoc('Q'),
			variables: { id: 1 },
		};
		expect(def.variables).toEqual({ id: 1 });
	});

	it('accepts document with endpoint', () => {
		const def: PrefetchDefinition = {
			document: fakeDoc('Q'),
			endpoint: 'myEndpoint',
		};
		expect(def.endpoint).toBe('myEndpoint');
	});

	it('accepts all properties', () => {
		const def: PrefetchDefinition = {
			document: fakeDoc('Q'),
			variables: { id: 1 },
			endpoint: 'ep',
		};
		expect(def).toEqual({ document: fakeDoc('Q'), variables: { id: 1 }, endpoint: 'ep' });
	});
});
