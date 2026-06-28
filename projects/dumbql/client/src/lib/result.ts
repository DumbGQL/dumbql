export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface NetworkErrorInfo {
  message: string;
  status?: number;
  statusText?: string;
}

export type GraphQLResult<T> =
  | { status: 'success'; data: T; graphQLErrors?: GraphQLError[] }
  | { status: 'error'; error: string; graphQLErrors?: GraphQLError[]; networkError?: NetworkErrorInfo };

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}
