import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: {
         project: [
           './tsconfig.json',
           './tsconfig.app.json',
           './tsconfig.spec.json',
           './projects/dumbql/core/tsconfig.lib.json',
           './projects/dumbql/downloader/tsconfig.lib.json',
           './projects/dumbql/subscriptions/tsconfig.lib.json',
           './projects/dumbql/file-upload/tsconfig.lib.json',
           './projects/dumbql/debugging/tsconfig.lib.json',
           './projects/dumbql/cache/tsconfig.lib.json',
           './projects/dumbql/fragments/tsconfig.lib.json',
           './projects/dumbql/pagination/tsconfig.lib.json',
           './projects/dumbql/ssr/tsconfig.lib.json',
           './projects/dumbql/testing/tsconfig.lib.json',
           './projects/dumbql/persisted-queries/tsconfig.lib.json',
            './projects/dumbql/middlewares/tsconfig.lib.json',
             './projects/dumbql/codegen/tsconfig.lib.json',
             './projects/dumbql/dev-server/tsconfig.lib.json',
          ],
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 0, styles: 0 },
      ],

      'no-var': 'off',
      'prefer-arrow-callback': 0,
      'array-bracket-spacing': 1,
      indent: ['error', 'tab', { ignoredNodes: ['PropertyDefinition'] }],
      semi: 'error',
      'max-len': ['error', 120, { ignoreStrings: true, ignoreTemplateLiterals: true }],
      'no-trailing-spaces': 'error',
      'no-console': 'error',
      'no-alert': 'error',
      quotes: ['error', 'single'],
      'dot-notation': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ['projects/dumbql/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'dumbql', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'dumbql', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['projects/dumbql/dev-server/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      '**/jest.config.ts',
      '*.json',
      'tsconfig.*.json',
      'node_modules',
      'tslint.json',
      'src/test.ts',
      '*.js',
      '*.md',
      'src/assets/**/*.js',
      'dist',
      '.angular',
    ],
  },
);
