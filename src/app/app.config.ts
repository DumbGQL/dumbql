import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTaiga, TuiNotificationService } from '@taiga-ui/core';
import { provideDumbql, loggingMiddleware, devtoolsMiddleware, provideDevtools, nullDetectionMiddleware, provideNullDetection } from '@dumbql/core';
import type { DevtoolsConfig } from '@dumbql/core';
import dumbqlConfig from '../../dumbql.config';

import { routes } from './app.routes';

const devtoolsCfg: DevtoolsConfig | undefined =
	typeof dumbqlConfig.devtools === 'object' ? dumbqlConfig.devtools : undefined;

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideHttpClient(),
		provideTaiga(),
		provideDumbql({
			...dumbqlConfig,
			middleware: [
				loggingMiddleware('DumbQL'),
				...(devtoolsCfg ? [devtoolsMiddleware(devtoolsCfg)] : []),
				nullDetectionMiddleware(),
			],
			onError: {
				provide: TuiNotificationService,
				use: (alerts, err) => alerts.open(err, { label: 'GraphQL Error', appearance: 'negative' }),
			},
		}),
		...(devtoolsCfg ? provideDevtools(devtoolsCfg) : []),
		provideNullDetection(),
		provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
	],
};
