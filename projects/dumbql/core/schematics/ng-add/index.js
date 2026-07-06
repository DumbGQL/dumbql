const { NodePackageInstallTask } = require('@angular-devkit/schematics/tasks');

const OVERLAY_TAG = '<app-null-overlay />';

function ngAdd(options) {
  return (tree, context) => {
    const packageJsonPath = '/package.json';
    if (tree.exists(packageJsonPath)) {
      const packageJson = JSON.parse(tree.read(packageJsonPath).toString('utf-8'));
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};

      const version = '^1.0.0';

      // Always install @dumbql/core
      packageJson.dependencies['@dumbql/core'] = version;

      // ── Core features ──
      if (options.cache !== false) {
        packageJson.dependencies['@dumbql/cache'] = version;
      }
      if (options.middlewares !== false) {
        packageJson.dependencies['@dumbql/middlewares'] = version;
      }
      if (options.subscriptions) {
        packageJson.dependencies['@dumbql/subscriptions'] = version;
      }
      if (options.upload) {
        packageJson.dependencies['@dumbql/file-upload'] = version;
      }

      // ── Recent / advanced features ──
      if (options.telemetry) {
        packageJson.dependencies['@dumbql/opentelemetry'] = version;
      }
      if (options.persistedQueries) {
        packageJson.dependencies['@dumbql/persisted-queries'] = version;
      }
      if (options.pagination) {
        packageJson.dependencies['@dumbql/pagination'] = version;
      }
      if (options.fragments) {
        packageJson.dependencies['@dumbql/fragments'] = version;
      }
      if (options.ssr) {
        packageJson.dependencies['@dumbql/ssr'] = version;
      }
      if (options.testing) {
        packageJson.devDependencies['@dumbql/testing'] = version;
      }
      if (options.debugging) {
        packageJson.devDependencies['@dumbql/debugging'] = version;
      }

      // Developer tooling — always install
      packageJson.devDependencies['@dumbql/downloader'] = version;

      tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));
      context.addTask(new NodePackageInstallTask());
    }

    const configPath = '/dumbql.config.ts';
    if (!tree.exists(configPath)) {
      const configTemplate = `import type { DumbqlConfig } from '@dumbql/core';

const config: DumbqlConfig = {
	endpoint: 'http://localhost:9099/gql',

	// ── Core ──
	errorPolicy: 'none',
	retryCount: 3,
	retryDelay: 1000,
	dedup: true,
	batchWindow: 50,

	// ── Subscriptions ──
	subscriptions: {
		wsEndpoint: 'ws://localhost:9099/gql',
		reconnect: true,
		reconnectInterval: 2000,
		lazy: true,
	},

	// ── Cache ──
	cache: {
		enabled: ${options.cache !== false ? 'true' : 'false'},
		maxAge: 300_000,
		serialize: true,
		typePolicies: {},
	},

	// ── Persisted Queries ──
	persistedQueries: {
		enabled: ${options.persistedQueries ? 'true' : 'false'},
		hash: 'sha256',
		autoPersist: true,
		useGetForHashedQueries: true,
	},

	// ── File Upload ──
	upload: {
		maxFiles: 10,
		maxFileSize: 10_485_760,
	},

	// ── Debug ──
	debug: {
		logOperations: true,
		logTiming: true,
		logCache: ${options.debugging ? 'true' : 'false'},
	},

	// ── Pagination ──
	pagination: {
		defaultLimit: 20,
		debounceMs: 300,
	},

	// ── SSR ──
	ssr: {
		transferState: ${options.ssr ? 'true' : 'false'},
		cacheTtl: 60_000,
	},

	// ── Testing ──
	testing: {
		enabled: ${options.testing ? 'true' : 'false'},
	},

	// ── Telemetry / OpenTelemetry ──
	telemetry: {
		enabled: ${options.telemetry ? 'true' : 'false'},
		tracing: {
			enabled: ${options.telemetry ? 'true' : 'false'},
			exporter: 'console',
			serviceName: 'dumbql-app',
		},
		tags: {
			env: 'development',
		},
	},

	// ── DevTools ──
	devtools: ${options.devtools !== false ? `{
		autoConnect: true,
		maxRequests: 500,
		captureSchema: true,
		endpoint: 'http://localhost:9099/gql',
	}` : 'false'},

	// ── Codegen (CLI-only) ──
	codegen: {
		schema: {
			endpoint: 'http://localhost:9099/gql',
			dir: './graphql',
			filename: 'schema.json',
			autoDownload: true,
		},
		types: {
			dir: './graphql/types',
			scalars: {
				DateTime: 'string',
				UUID: 'string',
				Upload: 'File',
			},
			enumsAsTypes: false,
			maybeValue: 'T | null | undefined',
			strictNullability: true,
		},
	},
};

export default config;
`;
      tree.create(configPath, configTemplate);
    }

    // ── Auto-wire NullOverlay ──
    if (options.nullOverlay !== false) {
      addNullOverlay(tree, context);
    }

    return tree;
  };
}

function addNullOverlay(tree, context) {
  // Try external template first: src/app/app.component.html
  const htmlPath = '/src/app/app.component.html';
  if (tree.exists(htmlPath)) {
    const content = tree.read(htmlPath).toString('utf-8');
    if (!content.includes(OVERLAY_TAG)) {
      tree.overwrite(htmlPath, content.trimEnd() + '\n' + OVERLAY_TAG + '\n');
      context.logger.info('✔ Added <app-null-overlay /> to app.component.html');
    } else {
      context.logger.info('✔ <app-null-overlay /> already present in app.component.html');
    }
    return;
  }

  // Fallback: inline template in app.component.ts
  const tsPath = '/src/app/app.component.ts';
  if (tree.exists(tsPath)) {
    let content = tree.read(tsPath).toString('utf-8');
    if (content.includes(OVERLAY_TAG)) {
      context.logger.info('✔ <app-null-overlay /> already present in app.component.ts');
      return;
    }

    // Find inline template:  template: `...` or templateUrl: '...'
    const inlineMatch = content.match(/template:\s*`([^`]*)`/);
    if (inlineMatch) {
      const newTemplate = inlineMatch[1].trimEnd() + '\n' + OVERLAY_TAG + '\n';
      content = content.replace(inlineMatch[0], 'template: `' + newTemplate + '`');
      tree.overwrite(tsPath, content);
      context.logger.info('✔ Added <app-null-overlay /> to inline template in app.component.ts');
    } else {
      context.logger.warn('⚠ Could not find template in app.component.ts. Manually add <app-null-overlay /> to your root component.');
    }
  } else {
    context.logger.warn('⚠ Could not find app.component.ts. Manually add <app-null-overlay /> to your root component.');
  }
}

module.exports = ngAdd;
