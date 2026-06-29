import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
	CacheService,
	provideCachePersistence,
} from '@dumbql/cache';

describe('CacheService', () => {
	let service: CacheService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [CacheService],
		});
		service = TestBed.inject(CacheService);
	});

	const userEntity = { __typename: 'User', id: '1', name: 'Alice', age: 30 };

	describe('delegation to NormalizedCache', () => {
		it('write stores entity, query retrieves it', () => {
			service.write(userEntity);
			expect(service.query('User', '1')).toEqual(userEntity);
		});

		it('query returns undefined for missing entity', () => {
			expect(service.query('User', 'ghost')).toBeUndefined();
		});

		it('merge updates fields on existing entity', () => {
			service.write(userEntity);
			service.merge({ __typename: 'User', id: '1', age: 31 });
			const result = service.query('User', '1')!;
			expect(result['name']).toBe('Alice');
			expect(result['age']).toBe(31);
		});

		it('evict removes entity', () => {
			service.write(userEntity);
			service.evict('User', '1');
			expect(service.query('User', '1')).toBeUndefined();
		});
	});

	describe('optimistic updates', () => {
		it('applyOptimistic modifies entity optimistically', () => {
			service.write(userEntity);
			service.applyOptimistic({
				id: 'opt-1',
				apply: (entities) => {
					const e = entities.get('User:1')!;
					entities.set('User:1', { ...e, name: 'Optimistic' });
				},
				rollback: () => {},
			});
			expect(service.query('User', '1')!['name']).toBe('Optimistic');
		});

		it('rollbackOptimistic restores state', () => {
			service.write(userEntity);
			service.applyOptimistic({
				id: 'opt-1',
				apply: (entities) => {
					const e = entities.get('User:1')!;
					entities.set('User:1', { ...e, name: 'Optimistic' });
				},
				rollback: () => {},
			});
			service.rollbackOptimistic('opt-1');
			expect(service.query('User', '1')!['name']).toBe('Alice');
		});

		it('commitOptimistic keeps changes', () => {
			service.write(userEntity);
			service.applyOptimistic({
				id: 'opt-1',
				apply: (entities) => {
					const e = entities.get('User:1')!;
					entities.set('User:1', { ...e, name: 'Committed' });
				},
				rollback: () => {},
			});
			service.commitOptimistic('opt-1');
			expect(service.query('User', '1')!['name']).toBe('Committed');
		});
	});

	describe('local state', () => {
		it('writeLocal stores value, readLocal retrieves it', () => {
			service.writeLocal('theme', 'dark');
			expect(service.readLocal('theme')).toBe('dark');
		});

		it('readLocal returns undefined for missing key', () => {
			expect(service.readLocal('missing')).toBeUndefined();
		});

		it('writeLocal overwrites existing value', () => {
			service.writeLocal('count', 1);
			service.writeLocal('count', 2);
			expect(service.readLocal('count')).toBe(2);
		});

		it('watchLocal emits current value on subscribe', () => {
			service.writeLocal('key', 'initial');
			const values: unknown[] = [];
			service.watchLocal('key').subscribe((v) => values.push(v));
			expect(values).toContain('initial');
		});

		it('watchLocal emits updates after writeLocal', () => {
			const values: unknown[] = [];
			service.watchLocal('key').subscribe((v) => values.push(v));
			service.writeLocal('key', 'v1');
			service.writeLocal('key', 'v2');
			expect(values).toContain('v1');
			expect(values).toContain('v2');
		});

		it('clearLocalState removes all local entries', () => {
			service.writeLocal('a', 1);
			service.writeLocal('b', 2);
			service.clearLocalState();
			expect(service.readLocal('a')).toBeUndefined();
			expect(service.readLocal('b')).toBeUndefined();
		});
	});

	describe('serialize / deserialize', () => {
		it('serialize produces JSON string with entities and local state', () => {
			service.write(userEntity);
			service.writeLocal('theme', 'dark');
			const json = service.serialize();
			const parsed = JSON.parse(json);
			expect(parsed.entities).toBeDefined();
			expect(parsed.localState).toBeDefined();
			expect(parsed.localState).toContainEqual(['theme', 'dark']);
		});

		it('deserialize restores entities and local state', () => {
			service.write(userEntity);
			service.writeLocal('theme', 'dark');
			const json = service.serialize();

			const service2 = TestBed.inject(CacheService);
			service2.deserialize(json);

			expect(service2.query('User', '1')).toEqual(userEntity);
			expect(service2.readLocal('theme')).toBe('dark');
		});
	});

	describe('collectGarbage', () => {
		it('delegates to gc.sweep and returns count', () => {
			service.write(userEntity);
			const count = service.collectGarbage();
			expect(typeof count).toBe('number');
		});
	});

	describe('persist', () => {
		it('does not throw when persistence service is not configured', () => {
			expect(() => service.persist()).not.toThrow();
		});
	});

	describe('constructor with persistence', () => {
		it('restores persisted entities on construction', () => {
			const items = new Map<string, string>();
			vi.stubGlobal('localStorage', {
				getItem: (k: string) => items.get(k) ?? null,
				setItem: (k: string, v: string) => items.set(k, v),
				removeItem: (k: string) => items.delete(k),
				clear: () => items.clear(),
				length: 0,
				key: () => null,
			});

			// First service with persistence configured
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [provideCachePersistence(), CacheService],
			});
			const persistService = TestBed.inject(CacheService);
			persistService.write(userEntity);
			persistService.persist();

			// Second service should restore from persistence
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [provideCachePersistence(), CacheService],
			});
			const restoredService = TestBed.inject(CacheService);
			expect(restoredService.query('User', '1')).toEqual(userEntity);

			vi.unstubAllGlobals();
		});
	});
});
