import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createYoga, createSchema } from 'graphql-yoga';
import type { GraphQLSchema } from 'graphql';
import type { DevServerConfig } from './types.js';

function loadSchema(config: DevServerConfig['mock']): GraphQLSchema {
  let typeDefs = '';
  const schemaPath = config?.schema ? resolve(config.schema) : resolve('graphql/schema.graphql');

  if (existsSync(schemaPath)) {
    typeDefs = readFileSync(schemaPath, 'utf-8');
  } else {
    typeDefs = 'type Query { ping: String } type Mutation { pong: String }';
  }

  if (config?.resolvers) {
    return createSchema({ typeDefs, resolvers: config.resolvers }) as GraphQLSchema;
  }

  return createSchema({ typeDefs }) as GraphQLSchema;
}

function createProxyHandler(frontendTarget: string) {
  return (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', frontendTarget);
    const isHttps = frontendTarget.startsWith('https');
    const requester = isHttps ? httpsRequest : httpRequest;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: req.method,
      headers: { ...req.headers },
    };

    if (options.headers?.host) {
      delete (options.headers as Record<string, string>)['host'];
    }

    const proxyReq = requester(options, (proxyRes: IncomingMessage) => {
      res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Bad Gateway: cannot proxy to ${frontendTarget}`);
    });

    req.pipe(proxyReq, { end: true });
  };
}

export function createDevServer(config: DevServerConfig = {}): Server {
  const schema = loadSchema(config.mock);
  const frontendTarget = config.proxy?.target ?? 'http://localhost:4200';

  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    cors: false,
  });

  const proxy = createProxyHandler(frontendTarget);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/graphql') {
      yoga(req, res);
      return;
    }

    proxy(req, res);
  });

  return server;
}

export function startDevServer(config: DevServerConfig & { port?: number }): Server {
  const port = config.port ?? 4000;
  const server = createDevServer(config);

  server.listen(port, () => {
    const frontend = config.proxy?.target ?? 'http://localhost:4200';
    console.log(`⚡ DumbQL Dev Server running at http://localhost:${port}`);
    console.log(`   ➜ GraphQL:   http://localhost:${port}/graphql`);
    console.log(`   ➜ Frontend:  ${frontend}`);
    console.log(`   ➜ Open:      http://localhost:${port}`);
  });

  return server;
}
