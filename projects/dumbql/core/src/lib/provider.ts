import { signal, computed } from '@angular/core';
import {
	DUMBQL_CONFIG,
	REACTIVE_DUMBQL_CONFIG,
	FEATURE_CONFIGS,
	type DumbqlConfig,
	type ReactiveDumbqlConfig,
	type GraphqlMiddleware,
	type FeatureConfig,
} from './dumbql-config';
import { validateDumbqlConfig, type ConfigValidationError } from './config.service';
import type { DevtoolsConfig } from './devtools';
import type { Provider } from '@angular/core';

// ─── Feature-level provider ─────────────────────────────────────────────────

export function provideDumbqlFeature(config: FeatureConfig): Provider[] {
	return [
		{
			provide: FEATURE_CONFIGS,
			useFactory: (existing: FeatureConfig[]) => [...(existing ?? []), config],
			deps: [[FEATURE_CONFIGS, { optional: true, skipSelf: true }]],
		},
	];
}

// ─── Fluent builder ─────────────────────────────────────────────────────────

class DumbqlConfigBuilder {
	private config: DumbqlConfig = {};

	endpoint(url: string): this {
		this.config = { ...this.config, endpoint: url };
		return this;
	}

	headers(headers: Record<string, string | (() => string)>): this {
		this.config = { ...this.config, headers: { ...this.config.headers, ...headers } };
		return this;
	}

	errorPolicy(policy: 'none' | 'all' | 'ignore'): this {
		this.config = { ...this.config, errorPolicy: policy };
		return this;
	}

	retry(count: number, delay = 1000): this {
		this.config = { ...this.config, retryCount: count, retryDelay: delay };
		return this;
	}

	dedup(enabled = true): this {
		this.config = { ...this.config, dedup: enabled };
		return this;
	}

	batch(windowMs: number): this {
		this.config = { ...this.config, batchWindow: windowMs };
		return this;
	}

	middleware(...mw: GraphqlMiddleware[]): this {
		this.config = { ...this.config, middleware: [...(this.config.middleware ?? []), ...mw] };
		return this;
	}

	showErrorsOnSuccess(enabled = true): this {
		this.config = { ...this.config, showErrorsOnSuccess: enabled };
		return this;
	}

	devAuth(token: string, enabled = true): this {
		this.config = { ...this.config, devAuth: { token, enabled } };
		return this;
	}

	// ─── Sub-configs ──────────────────────────────────────────────────────

	cache(config: DumbqlConfig['cache']): this {
		this.config = { ...this.config, cache: { ...this.config.cache, ...config } };
		return this;
	}

	subscriptions(config: DumbqlConfig['subscriptions']): this {
		this.config = { ...this.config, subscriptions: { ...this.config.subscriptions, ...config } };
		return this;
	}

	persistedQueries(config: DumbqlConfig['persistedQueries']): this {
		this.config = { ...this.config, persistedQueries: { ...this.config.persistedQueries, ...config } };
		return this;
	}

	upload(config: DumbqlConfig['upload']): this {
		this.config = { ...this.config, upload: { ...this.config.upload, ...config } };
		return this;
	}

	debug(config: boolean | DumbqlConfig['debug']): this {
		this.config = { ...this.config, debug: config };
		return this;
	}

	pagination(config: DumbqlConfig['pagination']): this {
		this.config = { ...this.config, pagination: { ...this.config.pagination, ...config } };
		return this;
	}

	ssr(config: DumbqlConfig['ssr']): this {
		this.config = { ...this.config, ssr: { ...this.config.ssr, ...config } };
		return this;
	}

	devtools(config: boolean | DevtoolsConfig): this {
		this.config = { ...this.config, devtools: config };
		return this;
	}

	telemetry(config: DumbqlConfig['telemetry']): this {
		this.config = { ...this.config, telemetry: { ...this.config.telemetry, ...config } };
		return this;
	}

	plugins(...plugins: DumbqlConfig['plugins']): this {
		this.config = { ...this.config, plugins: [...(this.config.plugins ?? []), ...(plugins ?? [])] };
		return this;
	}

	multiEndpoint(endpoints: string | DumbqlConfig['multiEndpoint'] = true): this {
		if (typeof endpoints === 'string') {
			this.config = { ...this.config, multiEndpoint: true, endpoints };
		} else {
			this.config = { ...this.config, multiEndpoint: endpoints };
		}
		return this;
	}

	onError(handler: DumbqlConfig['onError']): this {
		this.config = { ...this.config, onError: handler };
		return this;
	}

	errorHandler(handler: DumbqlConfig['errorHandler']): this {
		this.config = { ...this.config, errorHandler: handler };
		return this;
	}

	// ─── Merge raw config ─────────────────────────────────────────────────

	merge(raw: Partial<DumbqlConfig>): this {
		this.config = { ...this.config, ...raw };
		return this;
	}

	// ─── Validation ───────────────────────────────────────────────────────

	validate(): ConfigValidationError[] {
		return validateDumbqlConfig(this.config);
	}

	validateOrThrow(): void {
		const errors = this.validate();
		if (errors.length > 0) {
			const msg = errors.map((e) => `  - ${e.path}: ${e.message}`).join('\n');
			throw new Error(`DumbQL config validation failed:\n${msg}`);
		}
	}

	// ─── Build ────────────────────────────────────────────────────────────

	build(): DumbqlConfig {
		this.validateOrThrow();
		return this.config;
	}

	buildProviders(): Provider[] {
		return provideDumbql(this.build());
	}
}

// ─── Main entry ─────────────────────────────────────────────────────────────

/**
 * Create a DumbQL config with fluent API.
 *
 * @example
 * ```typescript
 * const config = dumbqlConfig()
 *   .endpoint('/graphql')
 *   .errorPolicy('all')
 *   .retry(3, 1000)
 *   .dedup()
 *   .cache({ enabled: true, maxAge: 60_000 })
 *   .middleware(loggingMiddleware)
 *   .build();
 *
 * // Or directly get providers:
 * providers: [
 *   ...dumbqlConfig()
 *     .endpoint('/graphql')
 *     .retry(3)
 *     .buildProviders(),
 * ]
 * ```
 */
export function dumbqlConfig(): DumbqlConfigBuilder {
	return new DumbqlConfigBuilder();
}

/**
 * Legacy provider function. Consider using `dumbqlConfig().buildProviders()` instead.
 */
export function provideDumbql(config: Partial<DumbqlConfig>): Provider[] {
	const merged: DumbqlConfig = {
		endpoint: '/graphql',
		errorPolicy: 'none',
		retryCount: 0,
		retryDelay: 1000,
		dedup: false,
		batchWindow: 0,
		devAuth: { enabled: true },
		...config,
	};

	const errors = validateDumbqlConfig(merged);
	if (errors.length > 0) {
		const msg = errors.map((e) => `  - ${e.path}: ${e.message}`).join('\n');
		throw new Error(`DumbQL config validation failed:\n${msg}`);
	}

	return buildProvidersWithReactive(merged);
}

function buildProvidersWithReactive(config: DumbqlConfig): Provider[] {
	const endpointSig = signal(config.endpoint ?? '/graphql');
	const errorPolicySig = signal(config.errorPolicy ?? 'none');
	const retryCountSig = signal(config.retryCount ?? 0);
	const retryDelaySig = signal(config.retryDelay ?? 1000);
	const dedupSig = signal(config.dedup ?? false);
	const batchWindowSig = signal(config.batchWindow ?? 0);
	const middlewareSig = signal<GraphqlMiddleware[]>(config.middleware ?? []);
	const debugSig = signal(config.debug ?? false);
	const devtoolsSig = signal(config.devtools ?? false);
	const rawSig = signal(config);
	const featuresSig = signal<FeatureConfig[]>(config.features ?? []);

	const reactiveConfig: ReactiveDumbqlConfig = {
		endpoint: endpointSig.asReadonly(),
		errorPolicy: errorPolicySig.asReadonly(),
		retryCount: retryCountSig.asReadonly(),
		retryDelay: retryDelaySig.asReadonly(),
		dedup: dedupSig.asReadonly(),
		batchWindow: batchWindowSig.asReadonly(),
		middleware: middlewareSig.asReadonly(),
		isDebugEnabled: computed(() => {
			const d = debugSig();
			return d === true || (typeof d === 'object' && Object.values(d).some(Boolean));
		}),
		isDevtoolsEnabled: computed(() => {
			const d = devtoolsSig();
			return d === true || (typeof d === 'object' && d.autoConnect !== false);
		}),
		features: featuresSig.asReadonly(),
		raw: rawSig.asReadonly(),
		update(partial: Partial<DumbqlConfig>) {
			rawSig.update((prev) => ({ ...prev, ...partial }));
			if (partial.endpoint !== undefined) endpointSig.set(partial.endpoint);
			if (partial.errorPolicy !== undefined) errorPolicySig.set(partial.errorPolicy);
			if (partial.retryCount !== undefined) retryCountSig.set(partial.retryCount);
			if (partial.retryDelay !== undefined) retryDelaySig.set(partial.retryDelay);
			if (partial.dedup !== undefined) dedupSig.set(partial.dedup);
			if (partial.batchWindow !== undefined) batchWindowSig.set(partial.batchWindow);
			if (partial.middleware !== undefined) middlewareSig.set(partial.middleware);
			if (partial.debug !== undefined) debugSig.set(partial.debug);
			if (partial.devtools !== undefined) devtoolsSig.set(partial.devtools);
			if (partial.features !== undefined) featuresSig.set(partial.features);
		},
	};

	return [
		{ provide: DUMBQL_CONFIG, useValue: config },
		{ provide: REACTIVE_DUMBQL_CONFIG, useValue: reactiveConfig },
	];
}
