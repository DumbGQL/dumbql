import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-middlewares',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './middlewares.html',
	styleUrl: './middlewares.scss',
})
export class DocsMiddlewares {
	protected readonly tocSections: TocSection[] = [
		{ id: 'auth-refresh', title: 'authRefresh' },
		{ id: 'retry-exchange', title: 'retryExchange' },
		{ id: 'focus-refetch', title: 'focusRefetch' },
		{ id: 'offline-queue', title: 'offlineQueue' },
		{ id: 'composing', title: 'Composing Middlewares' },
	];

	protected readonly authRefreshCode = `import { authRefresh } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefresh({
    getToken: () => inject(AuthService).token(),
    refreshToken: () => inject(AuthService).refresh(),
    onRefreshFailure: () => inject(Router).navigate(['/login']),
  }),
  createHttpLink({ uri: '/graphql' }),
);`;

	protected readonly retryExchangeCode = `import { retryExchange } from '@dumbql/middlewares';

const link = composeMiddlewares(
  retryExchange({
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    retryIf: (error) => error.status >= 500,
  }),
  createHttpLink({ uri: '/graphql' }),
);`;

	protected readonly focusRefetchCode = `import { focusRefetch } from '@dumbql/middlewares';

const link = composeMiddlewares(
  focusRefetch(),
  createHttpLink({ uri: '/graphql' }),
);`;

	protected readonly offlineQueueCode = `import { offlineQueue } from '@dumbql/middlewares';

const link = composeMiddlewares(
  offlineQueue({
    storage: localStorage,
    queueKey: 'dumbql-offline-queue',
  }),
  createHttpLink({ uri: '/graphql' }),
);`;

	protected readonly composingMiddlewaresCode = `import { composeMiddlewares, createHttpLink } from '@dumbql/core';
import { authRefresh, retryExchange, focusRefetch, offlineQueue } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefresh({ getToken: () => token() }),
  retryExchange({ maxAttempts: 3 }),
  focusRefetch(),
  offlineQueue(),
  createHttpLink({ uri: '/graphql' }),
);`;
}
