import { inject, type App, type InjectionKey } from 'vue';
import type { DumbqlClient } from '@dumbql/client';
import { registerDirectives } from './directives';

export const DUMBQL_CLIENT_KEY: InjectionKey<DumbqlClient> = Symbol('dumbql-client');

export function createDumbqlPlugin(client: DumbqlClient) {
	return {
		install(app: App): void {
			app.provide(DUMBQL_CLIENT_KEY, client);
			registerDirectives(app, client);
		},
	};
}

export function useClient(): DumbqlClient {
	const client = inject(DUMBQL_CLIENT_KEY, null);
	if (!client) {
		throw new Error('No DumbqlClient found. Install the plugin: app.use(createDumbqlPlugin(client))');
	}
	return client;
}
