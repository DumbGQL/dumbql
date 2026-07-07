import { defineWorkspace } from 'vitest/config';
import { resolve } from 'path';

const projectsDir = resolve(__dirname, 'projects/dumbql');

const alias = {
  '@dumbql/client': resolve(projectsDir, 'client/src/public-api.ts'),
  '@dumbql/cache': resolve(projectsDir, 'cache/src/public-api.ts'),
  '@dumbql/core': resolve(projectsDir, 'core/src/public-api.ts'),
};

interface ProjectOpts {
  name: string;
  include: string[];
  env?: string;
  aliases?: Record<string, string>;
}

function project({ name, include, env = 'node', aliases }: ProjectOpts) {
  return {
    ...(aliases ? { resolve: { alias: { ...aliases } } } : {}),
    test: {
      name,
      include,
      environment: env as 'node',
      coverage: {
        enabled: true,
        provider: 'v8' as const,
        reportsDirectory: './coverage',
        reporter: ['text', 'text-summary', 'lcov'],
        include: [
          'projects/dumbql/**/*.ts',
          '!projects/dumbql/**/*.spec.ts',
          '!projects/dumbql/**/*.d.ts',
          '!projects/dumbql/**/node_modules/**',
        ],
        thresholds: {
          perFile: false,
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
  };
}

export default defineWorkspace([
  project({ name: 'core', include: ['projects/dumbql/core/src/**/*.spec.ts'], aliases }),
  project({ name: 'middlewares', include: ['projects/dumbql/middlewares/src/**/*.spec.ts'] }),
  project({ name: 'opentelemetry', include: ['projects/dumbql/opentelemetry/src/**/*.spec.ts'] }),
  project({ name: 'fragments', include: ['projects/dumbql/fragments/src/**/*.spec.ts'] }),
  project({ name: 'persisted-queries', include: ['projects/dumbql/persisted-queries/src/**/*.spec.ts'] }),
  project({ name: 'codegen', include: ['projects/dumbql/codegen/src/**/*.spec.ts'] }),
  project({ name: 'client', include: ['projects/dumbql/client/src/**/*.spec.ts'], aliases: { '@dumbql/client': alias['@dumbql/client'] } }),
  project({ name: 'errors', include: ['projects/dumbql/errors/src/**/*.spec.ts', 'projects/dumbql/vue/src/**/*.spec.ts'], aliases: { '@dumbql/client': alias['@dumbql/client'] } }),
  project({ name: 'cache', include: ['projects/dumbql/cache/src/**/*.spec.ts'] }),
  project({ name: 'pagination', include: ['projects/dumbql/pagination/src/**/*.spec.ts'] }),
  project({ name: 'downloader', include: ['projects/dumbql/downloader/src/**/*.spec.ts'] }),
  project({ name: 'apollo-adapter', include: ['projects/dumbql/apollo-adapter/src/**/*.spec.ts'] }),
  project({ name: 'dev-server', include: ['projects/dumbql/dev-server/src/**/*.spec.ts'] }),
  project({ name: 'react', include: ['projects/dumbql/react/src/**/*.spec.ts'], aliases: { '@dumbql/client': alias['@dumbql/client'] } }),
]);
