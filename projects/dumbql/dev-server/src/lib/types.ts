export type Resolvers = Record<string, Record<string, (parent: any, args: any, context: any, info: any) => any>>;

export interface MockConfig {
  schema?: string;
  resolvers?: Resolvers;
}

export interface ProxyConfig {
  target: string;
  /** Force-enable URL rewriting (localhost → public host) in proxied responses */
  rewrite?: boolean;
}

export interface SpawnConfig {
  cmd: string;
  cwd?: string;
}

export interface DevServerConfig {
  mock?: MockConfig;
  proxy?: ProxyConfig;
  port?: number;
  spawn?: SpawnConfig;
}
