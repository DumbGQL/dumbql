import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const projectsDir = resolve(__dirname, 'projects/dumbql');

export default defineConfig({
  resolve: {
    alias: {
      '@dumbql/core': resolve(projectsDir, 'core/src/public-api.ts'),
      '@dumbql/fragments': resolve(projectsDir, 'fragments/src/public-api.ts'),
      '@dumbql/middlewares': resolve(projectsDir, 'middlewares/src/public-api.ts'),
      '@dumbql/opentelemetry': resolve(projectsDir, 'opentelemetry/src/public-api.ts'),
      '@dumbql/persisted-queries': resolve(projectsDir, 'persisted-queries/src/public-api.ts'),
      '@dumbql/codegen': resolve(projectsDir, 'codegen/src/public-api.ts'),
      '@dumbql/client': resolve(projectsDir, 'client/src/public-api.ts'),
      '@dumbql/cache': resolve(projectsDir, 'cache/src/public-api.ts'),
      '@dumbql/cache/angular': resolve(projectsDir, 'cache/src/angular.ts'),
    },
  },
  test: {
    globals: true,
    include: [
      'projects/dumbql/**/*.spec.ts',
      '!projects/dumbql/react/**',
      '!projects/dumbql/vue/**',
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      reportsDirectory: './coverage',
      reporter: ['text', 'text-summary', 'lcov', 'json'],
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
});
