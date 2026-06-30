import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn as spawnChild } from 'node:child_process';
import { createYoga, createSchema } from 'graphql-yoga';
import type { GraphQLSchema } from 'graphql';
import type { DevServerConfig } from './types.js';

function isInlineSchema(s: string): boolean {
  return /^\s*(type|schema|enum|input|interface|scalar|union|extend|directive)\b/.test(s);
}

function loadSchema(config: DevServerConfig['mock']): GraphQLSchema {
  let typeDefs = '';

  if (config?.schema) {
    if (isInlineSchema(config.schema)) {
      typeDefs = config.schema;
    } else {
      const schemaPath = resolve(config.schema);
      if (existsSync(schemaPath)) {
        typeDefs = readFileSync(schemaPath, 'utf-8');
      } else {
        typeDefs = 'type Query { ping: String } type Mutation { pong: String }';
      }
    }
  } else {
    const schemaPath = resolve('graphql/schema.graphql');
    if (existsSync(schemaPath)) {
      typeDefs = readFileSync(schemaPath, 'utf-8');
    } else {
      typeDefs = 'type Query { ping: String } type Mutation { pong: String }';
    }
  }

  if (config?.resolvers) {
    return createSchema({ typeDefs, resolvers: config.resolvers }) as GraphQLSchema;
  }

  return createSchema({ typeDefs }) as GraphQLSchema;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
};

function handleCors(res: ServerResponse): boolean {
  res.writeHead(204, CORS_HEADERS);
  res.end();
  return true;
}

const LOADING_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Starting up...</title>
  <meta http-equiv="refresh" content="3">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a2e; color: #e0e0e0; }
    .loader { width: 48px; height: 48px; border: 4px solid #e0e0e0; border-top-color: #6366f1; border-radius: 50%; animation: spin .8s linear infinite; margin-bottom: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .container { text-align: center; }
    p { font-size: 18px; color: #a0a0b0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <p>Starting frontend dev server...</p>
  </div>
</body>
</html>`;

function createProxyHandler(frontendTarget: string) {
  return (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      handleCors(res);
      return;
    }

    const url = new URL(req.url ?? '/', frontendTarget);
    const isHttps = frontendTarget.startsWith('https');
    const requester = isHttps ? httpsRequest : httpRequest;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      headers[k] = Array.isArray(v) ? (v as string[]).join(', ') : (v as string);
    }
    Object.assign(headers, CORS_HEADERS);
    delete headers['host'];

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: req.method,
      headers,
    };

    const proxyReq = requester(options, (proxyRes: IncomingMessage) => {
      const flatHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        flatHeaders[k] = Array.isArray(v) ? (v as string[]).join(', ') : (v as string);
      }
      const combinedHeaders = { ...flatHeaders, ...CORS_HEADERS };
      res.writeHead(proxyRes.statusCode ?? 200, combinedHeaders);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS });
        res.end(LOADING_PAGE);
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
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
  });

  const proxy = createProxyHandler(frontendTarget);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'OPTIONS') {
      handleCors(res);
      return;
    }

    if (url.pathname === '/graphql') {
      yoga(req, res);
      return;
    }

    proxy(req, res);
  });

  return server;
}

function waitForTarget(url: string, timeout = 300_000, interval = 1_000): Promise<void> {
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
          timeout: 10_000,
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

  if (config.spawn) {
    const [cmd, ...args] = config.spawn.cmd.split(/\s+/);
    const child = spawnChild(cmd, args, {
      cwd: config.spawn.cwd,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('exit', (code) => {
      if (code && code > 0) {
        console.warn(`  Spawned process exited with code ${code}`);
      }
    });
    console.log(`  Spawning: ${config.spawn.cmd}`);
  }

  waitForTarget(frontend)
    .then(() => {
      console.log(`  Frontend ready: ${frontend}`);
    })
    .catch(() => {
      console.warn(`  Frontend at ${frontend} never responded`);
    });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`DumbQL Dev Server running at http://localhost:${port}`);
      console.log(`  GraphQL:   http://localhost:${port}/graphql`);
      console.log(`  Frontend:  ${frontend}`);
      resolve(server);
    });
  });
}
