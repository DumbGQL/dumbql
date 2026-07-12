import type { GraphqlMiddleware, GraphqlRequestContext } from './middleware';
import type { GraphQLResult } from './graphql.service';
import { throwError, type Observable } from 'rxjs';

export interface QueryCostConfig {
	/** Maximum allowed query depth. Default: 10 */
	readonly maxDepth?: number;
	/** Maximum estimated cost. Default: 1000 */
	readonly maxCost?: number;
	/** Cost per field. Default: 1 */
	readonly fieldCost?: number;
	/** Cost multiplier per nested level. Default: 10 */
	readonly depthMultiplier?: number;
	/** Mode: 'block' rejects expensive queries, 'warn' logs but allows. Default: 'block' */
	readonly mode?: 'block' | 'warn';
	/** Callback when query exceeds limits */
	readonly onExceeded?: (info: { readonly depth: number; readonly cost: number; readonly query: string }) => void;
}

function countDepth(query: string): number {
	let maxDepth = 0;
	let depth = 0;

	for (const ch of query) {
		if (ch === '{') {
			depth++;
			if (depth > maxDepth) maxDepth = depth;
		} else if (ch === '}') {
			depth--;
		}
	}

	return maxDepth;
}

function estimateCost(
	query: string,
	fieldCost: number,
	depthMultiplier: number,
): number {
	let cost = 0;
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (const ch of query) {
		if (escaped) {
			escaped = false;
			continue;
		}
		if (ch === '\\') {
			escaped = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;

		if (ch === '{') {
			depth++;
		} else if (ch === '}') {
			depth--;
		} else if (ch === ':' || ch === '(') {
			cost += fieldCost * Math.pow(depthMultiplier, depth);
		}
	}

	return cost;
}

export function queryCostMiddleware(config?: QueryCostConfig): GraphqlMiddleware {
	const maxDepth = config?.maxDepth ?? 10;
	const maxCost = config?.maxCost ?? 1000;
	const fieldCost = config?.fieldCost ?? 1;
	const depthMultiplier = config?.depthMultiplier ?? 10;
	const mode = config?.mode ?? 'block';

	return (
		request: GraphqlRequestContext,
		next: (req: GraphqlRequestContext) => Observable<GraphQLResult<unknown>>,
	) => {
		const depth = countDepth(request.query);
		const cost = estimateCost(request.query, fieldCost, depthMultiplier);

		if (depth > maxDepth || cost > maxCost) {
			config?.onExceeded?.({ depth, cost, query: request.query });

			if (mode === 'warn') {
				// eslint-disable-next-line no-console
				console.warn(
					`DumbQL QueryCost: query exceeds limits (depth: ${depth}/${maxDepth}, cost: ${cost}/${maxCost}). ` +
						'Allowed by warn mode.',
				);
				return next(request);
			}

			return throwError(() => new Error(
				`DumbQL QueryCost: query rejected (depth: ${depth}/${maxDepth}, cost: ${cost}/${maxCost}). ` +
					'Simplify the query or increase limits in config.',
			));
		}

		return next(request);
	};
}
