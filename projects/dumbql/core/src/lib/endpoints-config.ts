import type { GraphqlMiddleware } from './middleware';
import type { ErrorPolicy } from './graphql.service';

export interface EndpointRoute {
	url: string;
	headers?: Record<string, string | (() => string)>;
	/** Per-endpoint middleware pipeline. Applied after global middleware. */
	middleware?: GraphqlMiddleware[];
	/** Per-endpoint error policy override. */
	errorPolicy?: ErrorPolicy;
	/** Per-endpoint retry count override. */
	retryCount?: number;
	/** Per-endpoint retry delay override (ms). */
	retryDelay?: number;
	/** Fallback endpoint name when this endpoint fails (5xx / timeout). */
	fallbackTo?: string;
	/** Health check path appended to URL (e.g. "/health"). If set, a GET is sent on startup. */
	healthCheck?: string;
	/** Transform error messages before they propagate. */
	transformError?: (message: string, statusCode?: number) => string;
	/** Mock mode — skip network, return schema-typed stubs. */
	mock?: boolean;
}

export interface EndpointGroup {
	/** Route names belonging to this group. */
	routes: string[];
}

export interface EndpointsYaml {
	default_endpoint: string;
	routes: Record<string, EndpointRoute>;
	/** Named groups for bulk operations. */
	groups?: Record<string, EndpointGroup>;
}

export type TransformFn = (message: string, statusCode?: number) => string;
const transformRegistry = new Map<string, TransformFn>();

/** Register a named error transform function (not serializable in YAML). */
export function registerTransformError(name: string, fn: TransformFn): void {
	transformRegistry.set(name, fn);
}

/** Resolve a named error transform function. */
export function resolveTransformError(name: string): TransformFn | undefined {
	return transformRegistry.get(name);
}

export function parseEndpointsYaml(raw: string): EndpointsYaml {
	const lines = raw.split('\n');
	const result: EndpointsYaml = {
		default_endpoint: '',
		routes: {},
		groups: {},
	};

	let currentRoute: string | null = null;
	let currentHeaders: Record<string, string | (() => string)> | null = null;
	let inHeaders = false;
	let inMiddleware = false;
	let inGroups = false;
	let currentGroup: string | null = null;

	const flushHeaders = (): void => {
		if (currentRoute && currentHeaders && Object.keys(currentHeaders).length > 0) {
			if (!result.routes[currentRoute]) {
				result.routes[currentRoute] = { url: '', headers: currentHeaders };
			} else {
				result.routes[currentRoute].headers = currentHeaders;
			}
		}
	};

	const getIndent = (line: string): number => {
		let count = 0;
		for (const ch of line) {
			if (ch === ' ' || ch === '\t') count++;
			else break;
		}
		return count;
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#')) continue;

		const indent = getIndent(line);

		// Top-level keys (indent 0)
		if (indent === 0) {
			flushHeaders();
			inHeaders = false;
			inMiddleware = false;
			inGroups = false;
			currentHeaders = null;

			const defaultMatch = trimmed.match(/^default_endpoint:\s*(.+)$/);
			if (defaultMatch) {
				result.default_endpoint = defaultMatch[1].trim().replace(/['"]/g, '');
				continue;
			}

			if (/^routes:\s*$/.test(trimmed)) {
				continue;
			}

			if (/^groups:\s*$/.test(trimmed)) {
				inGroups = true;
				continue;
			}
		}

		// Indent 2: route names or group names
		if (indent === 2) {
			flushHeaders();
			inHeaders = false;
			inMiddleware = false;
			currentHeaders = null;

			const routeMatch = trimmed.match(/^(\w[\w-]*):\s*$/);
			if (routeMatch) {
				inGroups = false;
				currentRoute = routeMatch[1];
				currentGroup = null;
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '' };
				}
				continue;
			}
		}

		// Indent 2 inside groups
		if (indent === 2 && inGroups) {
			const groupMatch = trimmed.match(/^(\w[\w-]*):\s*$/);
			if (groupMatch) {
				currentGroup = groupMatch[1];
				if (!result.groups) result.groups = {};
				result.groups[currentGroup] = { routes: [] };
				continue;
			}
		}

		// Indent 4: route properties
		if (indent === 4 && currentRoute && !inGroups) {
			const headersMatch = trimmed.match(/^headers:\s*$/);
			if (headersMatch) {
				inHeaders = true;
				inMiddleware = false;
				currentHeaders = {};
				continue;
			}

			const middlewareMatch = trimmed.match(/^middleware:\s*$/);
			if (middlewareMatch) {
				inHeaders = false;
				inMiddleware = true;
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', middleware: [] };
				} else {
					result.routes[currentRoute].middleware = [];
				}
				continue;
			}

			inHeaders = false;
			inMiddleware = false;

			const urlMatch = trimmed.match(/^url:\s*(.+)$/);
			if (urlMatch) {
				const url = urlMatch[1].trim().replace(/['"]/g, '');
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url };
				} else {
					result.routes[currentRoute].url = url;
				}
				continue;
			}

			const errorPolicyMatch = trimmed.match(/^errorPolicy:\s*(.+)$/);
			if (errorPolicyMatch) {
				const policy = errorPolicyMatch[1].trim().replace(/['"]/g, '') as ErrorPolicy;
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', errorPolicy: policy };
				} else {
					result.routes[currentRoute].errorPolicy = policy;
				}
				continue;
			}

			const retryCountMatch = trimmed.match(/^retryCount:\s*(.+)$/);
			if (retryCountMatch) {
				const count = parseInt(retryCountMatch[1].trim(), 10);
				if (!isNaN(count)) {
					if (!result.routes[currentRoute]) {
						result.routes[currentRoute] = { url: '', retryCount: count };
					} else {
						result.routes[currentRoute].retryCount = count;
					}
				}
				continue;
			}

			const retryDelayMatch = trimmed.match(/^retryDelay:\s*(.+)$/);
			if (retryDelayMatch) {
				const delay = parseInt(retryDelayMatch[1].trim(), 10);
				if (!isNaN(delay)) {
					if (!result.routes[currentRoute]) {
						result.routes[currentRoute] = { url: '', retryDelay: delay };
					} else {
						result.routes[currentRoute].retryDelay = delay;
					}
				}
				continue;
			}

			const fallbackMatch = trimmed.match(/^fallbackTo:\s*(.+)$/);
			if (fallbackMatch) {
				const target = fallbackMatch[1].trim().replace(/['"]/g, '');
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', fallbackTo: target };
				} else {
					result.routes[currentRoute].fallbackTo = target;
				}
				continue;
			}

			const healthCheckMatch = trimmed.match(/^healthCheck:\s*(.+)$/);
			if (healthCheckMatch) {
				const path = healthCheckMatch[1].trim().replace(/['"]/g, '');
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', healthCheck: path };
				} else {
					result.routes[currentRoute].healthCheck = path;
				}
				continue;
			}

			const transformErrorMatch = trimmed.match(/^transformError:\s*(.+)$/);
			if (transformErrorMatch) {
				const name = transformErrorMatch[1].trim().replace(/['"]/g, '');
				const fn = resolveTransformError(name);
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', transformError: fn };
				} else {
					result.routes[currentRoute].transformError = fn;
				}
				continue;
			}

			const mockMatch = trimmed.match(/^mock:\s*(true|false)$/);
			if (mockMatch) {
				const val = mockMatch[1] === 'true';
				if (!result.routes[currentRoute]) {
					result.routes[currentRoute] = { url: '', mock: val };
				} else {
					result.routes[currentRoute].mock = val;
				}
				continue;
			}
		}

		// Indent 4 inside groups: route list items
		if (indent === 4 && inGroups && currentGroup && result.groups?.[currentGroup]) {
			const itemMatch = trimmed.match(/^-\s+(.+)$/);
			if (itemMatch) {
				const routeName = itemMatch[1].trim().replace(/['"]/g, '');
				result.groups[currentGroup].routes.push(routeName);
				continue;
			}
		}

		// Indent 6: header key-value pairs or middleware array items
		if (indent === 6 && currentRoute) {
			if (inHeaders && currentHeaders) {
				const headerMatch = trimmed.match(/^(\w[\w-]*):\s*(.+)$/);
				if (headerMatch) {
					const key = headerMatch[1];
					const value = headerMatch[2].trim().replace(/['"]/g, '');
					currentHeaders[key] = value;
					continue;
				}
			}

			if (inMiddleware) {
				const itemMatch = trimmed.match(/^-\s+(.+)$/);
				if (itemMatch) {
					const value = itemMatch[1].trim().replace(/['"]/g, '');
					if (!result.routes[currentRoute]) {
						result.routes[currentRoute] = { url: '', middleware: [value] };
					} else {
						if (!result.routes[currentRoute].middleware) {
							result.routes[currentRoute].middleware = [];
						}
						result.routes[currentRoute].middleware!.push(value);
					}
					continue;
				}
			}
		}
	}

	flushHeaders();

	return result;
}

export function validateEndpointsYaml(config: EndpointsYaml): string[] {
	const errors: string[] = [];

	if (!config.default_endpoint) {
		errors.push('Missing required field: default_endpoint');
	}

	if (!config.routes || Object.keys(config.routes).length === 0) {
		errors.push('Missing required field: routes (must have at least one route)');
	}

	if (config.default_endpoint && config.routes && !config.routes[config.default_endpoint]) {
		errors.push(
			`default_endpoint "${config.default_endpoint}" references a route that does not exist in routes`,
		);
	}

	for (const [name, route] of Object.entries(config.routes ?? {})) {
		if (!route.url) {
			errors.push(`Route "${name}" is missing required field: url`);
		}
		if (route.errorPolicy && !['none', 'all', 'ignore'].includes(route.errorPolicy)) {
			errors.push(
				`Route "${name}" has invalid errorPolicy: "${route.errorPolicy}" (expected none|all|ignore)`,
			);
		}
		if (route.retryCount !== undefined && (route.retryCount < 0 || !Number.isInteger(route.retryCount))) {
			errors.push(
				`Route "${name}" has invalid retryCount: ${route.retryCount} (expected non-negative integer)`,
			);
		}
		if (route.retryDelay !== undefined && (route.retryDelay < 0 || !Number.isInteger(route.retryDelay))) {
			errors.push(
				`Route "${name}" has invalid retryDelay: ${route.retryDelay} (expected non-negative integer)`,
			);
		}
		if (route.fallbackTo && !config.routes?.[route.fallbackTo]) {
			errors.push(
				`Route "${name}" fallbackTo "${route.fallbackTo}" references a route that does not exist`,
			);
		}
	}

	// Validate groups reference existing routes
	for (const [groupName, group] of Object.entries(config.groups ?? {})) {
		for (const routeName of group.routes) {
			if (!config.routes?.[routeName]) {
				errors.push(
					`Group "${groupName}" references route "${routeName}" that does not exist`,
				);
			}
		}
	}

	return errors;
}

/** Resolve `${ENV_VAR}` patterns in header values using `process.env` or `import.meta.env`. */
export function resolveHeaderEnvVars(
	headers: Record<string, string | (() => string)>,
): Record<string, string | (() => string)> {
	const resolved: Record<string, string | (() => string)> = {};
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value === 'function') {
			resolved[key] = value;
			continue;
		}
		const envPattern = /\$\{(\w+)\}/g;
		if (envPattern.test(value)) {
			resolved[key] = () =>
				value.replace(envPattern, (_, envKey: string) => {
					if (typeof process !== 'undefined' && process.env?.[envKey]) {
						return process.env[envKey]!;
					}
					if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
						const env = (import.meta as { env: Record<string, string> }).env;
						if (env[envKey]) return env[envKey];
					}
					return '';
				});
		} else {
			resolved[key] = value;
		}
	}
	return resolved;
}

export function generateEndpointsYamlTemplate(): string {
	return `# DumbQL Endpoints Configuration
# Define multiple GraphQL endpoints and reference them by name.

default_endpoint: main

routes:
  main:
    url: http://localhost:4000/graphql
    headers:
      Authorization: "Bearer \${TOKEN}"
    errorPolicy: none
    retryCount: 3
    retryDelay: 1000
    fallbackTo: standby
    healthCheck: /health

  users:
    url: http://localhost:4001/graphql
    errorPolicy: all

  payments:
    url: http://localhost:4002/graphql
    errorPolicy: none
    retryCount: 0
    retryDelay: 0

  standby:
    url: http://localhost:4003/graphql
    errorPolicy: all

groups:
  core:
    - main
    - users
  financial:
    - payments
`;
}
