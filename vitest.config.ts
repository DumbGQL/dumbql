import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['projects/dumbql/*/src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
