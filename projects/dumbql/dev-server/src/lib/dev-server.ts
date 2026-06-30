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
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end(`Bad Gateway: cannot proxy to ${frontendTarget}`);
      }
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

function waitForTarget(url: string, timeout = 60_000, interval = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const isHttps = url.startsWith('https');
    const requester = isHttps ? httpsRequest : httpRequest;
    const parsed = new URL(url);

    function poll() {
      const req = requester(
        {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: '/',
          method: 'HEAD',
          timeout: 2000,
        },
        (res) => {
          res.resume();
          resolve();
        },
      );

      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }
        setTimeout(poll, interval);
      });

      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
          return;
        }
        setTimeout(poll, interval);
      });

      req.end();
    }

    poll();
  });
}

export async function startDevServer(config: DevServerConfig & { port?: number }): Promise<Server> {
  const port = config.port ?? 4000;
  const frontend = config.proxy?.target ?? 'http://localhost:4200';
  const server = createDevServer(config);

  // Print URL early so StackBlitz picks up the proxy port for preview
  console.log(`DumbQL Dev Server: http://localhost:${port}/`);

  try {
    await waitForTarget(frontend);
  } catch {
    console.warn(`Frontend dev server at ${frontend} not available yet, starting anyway...`);
  }

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`DumbQL Dev Server running at http://localhost:${port}`);
      console.log(`  GraphQL:   http://localhost:${port}/graphql`);
      console.log(`  Frontend:  ${frontend}`);
      resolve(server);
    });
  });
}
