import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-middlewares',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './middlewares.html',
  styleUrl: './middlewares.scss',
})
export class DocsMiddlewares {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/middlewares');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/middlewares/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'auth-refresh', title: 'authRefreshMiddleware' },
    { id: 'retry-exchange', title: 'retryExchange' },
    { id: 'focus-refetch', title: 'focusRefetchMiddleware' },
    { id: 'offline-queue', title: 'offlineQueueMiddleware' },
    { id: 'composing', title: 'Composing Middlewares' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly authRefreshCode = `import { authRefreshMiddleware } from '@dumbql/middlewares';

const middleware = authRefreshMiddleware({
  refreshToken: () => fetch('/auth/refresh').then(r => r.json()),
});`;

  protected readonly retryExchangeCode = `import { retryExchange } from '@dumbql/middlewares';

const middleware = retryExchange({
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
});`;

  protected readonly focusRefetchCode = `import { focusRefetchMiddleware } from '@dumbql/middlewares';

const middleware = focusRefetchMiddleware({
  minStaleSeconds: 30,
});`;

  protected readonly offlineQueueCode = `import { offlineQueueMiddleware } from '@dumbql/middlewares';
import { provideOfflineQueue } from '@dumbql/middlewares/angular';

// Provider (Angular only):
export const appConfig = {
  providers: [provideOfflineQueue({ maxQueue: 50 })],
};

const middleware = offlineQueueMiddleware();`;

  protected readonly composingMiddlewaresCode = `import { composeMiddlewares, createHttpLink } from '@dumbql/core';
import { authRefreshMiddleware, retryExchange, focusRefetchMiddleware, offlineQueueMiddleware } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefreshMiddleware({ refreshToken: () => getToken() }),
  retryExchange({ maxRetries: 3 }),
  focusRefetchMiddleware(),
  offlineQueueMiddleware(),
  createHttpLink({ uri: '/graphql' }),
);`;
}
