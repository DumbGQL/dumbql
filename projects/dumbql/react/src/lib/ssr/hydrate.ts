/**
 * Hydrate SSR data on the client side.
 *
 * Usage:
 * ```tsx
 * // In your entry point (client-side):
 * const ssrData = window.__DUMBQL_DATA__;
 * hydrateSSRData(ssrData);
 * ```
 */
export function hydrateSSRData(data: Record<string, unknown>): void {
	if (typeof window === 'undefined') return;
	// Store SSR data on window for hooks to consume
	(window as { __DUMBQL_DATA__?: Record<string, unknown> }).__DUMBQL_DATA__ = data;
}

/**
 * Read SSR-hydrated data for a given query key.
 * Returns undefined if no SSR data is available.
 */
export function readSSRData<T>(key: string): T | undefined {
	if (typeof window === 'undefined') return undefined;
	const data = (window as { __DUMBQL_DATA__?: Record<string, unknown> }).__DUMBQL_DATA__;
	return data?.[key] as T | undefined;
}

/**
 * Clear SSR data from window after hydration is complete.
 */
export function clearSSRData(): void {
	if (typeof window === 'undefined') return;
	delete (window as { __DUMBQL_DATA__?: Record<string, unknown> }).__DUMBQL_DATA__;
}
