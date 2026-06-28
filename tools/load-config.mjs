import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Load dumbql config from various formats.
 * Resolution order:
 *   1. dumbql.config.ts  (via dynamic import — needs Node >=22 --experimental-strip-types)
 *   2. dumbql.config.mjs
 *   3. dumbql.config.yaml / dumbql.config.yml
 *   4. dumbql.config.json
 *
 * Returns the parsed config object and the resolved path.
 */
export async function loadConfig(cwd = process.cwd()) {
	const candidates = [
		'dumbql.config.ts',
		'dumbql.config.mjs',
		'dumbql.config.yaml',
		'dumbql.config.yml',
		'dumbql.config.json',
	];

	for (const file of candidates) {
		const fullPath = resolve(cwd, file);
		if (!existsSync(fullPath)) continue;

		const ext = file.split('.').pop();

		if (ext === 'ts' || ext === 'mjs') {
			const module = await import(fullPath);
			const config = module.default ?? module;
			applyEnvOverrides(config);
			return { config, path: fullPath };
		}

		if (ext === 'yaml' || ext === 'yml') {
			const yaml = await importJsYaml();
			const raw = readFileSync(fullPath, 'utf-8');
			const config = yaml.load(raw);
			applyEnvOverrides(config);
			return { config, path: fullPath };
		}

		if (ext === 'json') {
			const raw = readFileSync(fullPath, 'utf-8');
			const config = JSON.parse(raw);
			applyEnvOverrides(config);
			return { config, path: fullPath };
		}
	}

	throw new Error(
		'No dumbql config found. Create dumbql.config.ts, .mjs, .yaml, .yml, or .json in project root.',
	);
}

function applyEnvOverrides(config) {
	if (process.env['GRAPHQL_ENDPOINT']) {
		config.endpoint = process.env['GRAPHQL_ENDPOINT'];
	}
	if (process.env['GRAPHQL_WS_ENDPOINT'] && config.subscriptions) {
		config.subscriptions.wsEndpoint = process.env['GRAPHQL_WS_ENDPOINT'];
	}
	if (process.env['SCHEMA_ENDPOINT'] && config.codegen?.schema) {
		config.codegen.schema.endpoint = process.env['SCHEMA_ENDPOINT'];
	}
}

async function importJsYaml() {
	try {
		return await import('js-yaml');
	} catch {
		throw new Error(
			'js-yaml is required for YAML config files. Install it: npm i -D js-yaml',
		);
	}
}
