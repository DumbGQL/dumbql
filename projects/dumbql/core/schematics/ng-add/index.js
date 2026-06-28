const { NodePackageInstallTask } = require('@angular-devkit/schematics/tasks');

function ngAdd(options) {
  return (tree, context) => {
    const packageJsonPath = '/package.json';
    if (tree.exists(packageJsonPath)) {
      const packageJson = JSON.parse(tree.read(packageJsonPath).toString('utf-8'));
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};

      const version = '^0.0.1';
      
      // Always install @dumbql/core
      packageJson.dependencies['@dumbql/core'] = version;

      // Install selected auxiliary libraries
      if (options.cache !== false) {
        packageJson.dependencies['@dumbql/cache'] = version;
      }
      if (options.subscriptions) {
        packageJson.dependencies['@dumbql/subscriptions'] = version;
      }
      if (options.upload) {
        packageJson.dependencies['@dumbql/file-upload'] = version;
      }
      if (options.middlewares !== false) {
        packageJson.dependencies['@dumbql/middlewares'] = version;
      }
      
      // Developer tooling and always install core features for codegen
      packageJson.devDependencies['@dumbql/downloader'] = version;

      tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));
      context.addTask(new NodePackageInstallTask());
    }

    const configPath = '/dumbql.config.ts';
    if (!tree.exists(configPath)) {
      const configTemplate = `import type { DumbqlConfig } from '@dumbql/core';

const config: DumbqlConfig = {
	endpoint: 'http://localhost:9099/gql',
	cache: {
		enabled: ${options.cache !== false ? 'true' : 'false'},
		maxAge: 300_000,
		serialize: true,
	},
	devtools: ${options.devtools !== false ? 'true' : 'false'},
	codegen: {
		schema: {
			endpoint: 'http://localhost:9099/gql',
			dir: './graphql',
			filename: 'schema.json',
			autoDownloadSchema: true,
		},
	},
};

export default config;
`;
      tree.create(configPath, configTemplate);
    }

    return tree;
  };
}

module.exports = ngAdd;
