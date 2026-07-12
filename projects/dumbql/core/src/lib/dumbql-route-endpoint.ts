import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EndpointsService } from './endpoints.service';
import { GraphqlEndpoint } from './endpoint';

/**
 * Read the `dumbqlEndpoint` name from the current route's `data` and resolve
 * it to a `GraphqlEndpoint` via `EndpointsService`.
 *
 * Usage:
 * ```ts
 * const ep = injectEndpointFromRoute();
 * ep.query(GET_USERS);
 * ```
 */
export function injectEndpointFromRoute(key = 'dumbqlEndpoint'): GraphqlEndpoint {
	const route = inject(ActivatedRoute);
	const endpointName = route.snapshot.data[key] as string | undefined;
	if (!endpointName) {
		throw new Error(
			`DumbQL: No "${key}" found in route data. ` +
				`Add it to your route config: { data: { ${key}: 'yourEndpoint' } }`,
		);
	}
	const endpoints = inject(EndpointsService);
	return endpoints.resolveEndpoint(endpointName);
}

/**
 * A `ResolveFn` that resolves an endpoint by name and stores
 * the resolved `GraphqlEndpoint` in route data under `dumbqlEndpoint`.
 *
 * ```ts
 * const routes: Routes = [
 *   { path: 'users', resolve: { dumbqlEndpoint: routeEndpoint('users') } }
 * ];
 * ```
 */
export function routeEndpoint(endpointName: string) {
	return () => {
		const endpoints = inject(EndpointsService);
		return endpoints.resolveEndpoint(endpointName);
	};
}
