import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-subscriptions',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class DocsSubscriptions {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/subscriptions');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/subscriptions/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'graphql-subscription-service', title: 'GraphqlSubscriptionService' },
      { id: 'subscribe', title: 'subscribe()' },
      { id: 'graphql-transport-ws', title: 'graphql-transport-ws Protocol' },
    ]);
  }

  protected readonly provideSubscriptionsCode = `import { provideDumbqlSubscriptions } from '@dumbql/subscriptions/angular';

provideDumbqlSubscriptions({
  wsUrl: 'ws://localhost:4000/graphql',
});`;

  protected readonly subscribeCode = `import { GraphqlSubscriptionService } from '@dumbql/subscriptions/angular';
import { gql } from '@dumbql/core';

const subscription = inject(GraphqlSubscriptionService);
const newPosts = subscription.subscribe(
  gql\`subscription OnNewPost { newPost { id title createdAt } }\`,
);

// newPosts is an Observable<Post | null>
// It updates every time the server pushes a new event`;

  protected readonly connectionParamsCode = `provideDumbqlSubscriptions({
  wsUrl: 'ws://localhost:4000/graphql',
  connectionParams: () => ({
    authorization: \`Bearer \${inject(AuthService).token()}\`,
  }),
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
});`;
}
