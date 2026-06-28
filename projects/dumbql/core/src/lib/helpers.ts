import type { GraphQLResult } from './graphql.service';

export function isSuccess<T>(result: GraphQLResult<T>): result is { status: 'success'; data: T } {
	return result.status === 'success';
}

export function isError<T>(result: GraphQLResult<T>): result is { status: 'error'; error: string } {
	return result.status === 'error';
}

export function unwrap<T>(result: GraphQLResult<T>): T | null {
	if (result.status === 'success') return result.data;
	return null;
}

export function unwrapOrThrow<T>(result: GraphQLResult<T>): T {
	if (result.status === 'error') throw new Error(result.error);
	return result.data;
}

export function mapResult<T, U>(
	result: GraphQLResult<T>,
	fn: (data: T) => U,
): GraphQLResult<U> {
	if (result.status === 'error') return result as unknown as GraphQLResult<U>;
	return { status: 'success', data: fn(result.data) };
}
