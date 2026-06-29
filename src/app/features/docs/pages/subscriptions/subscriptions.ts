import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-subscriptions',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './subscriptions.html',
	styleUrl: './subscriptions.scss',
})
export class DocsSubscriptions {
	protected readonly versionService = inject(VersionService);

	protected readonly tocSections: TocSection[] = [
		{ id: 'graphql-subscription-service', title: 'GraphqlSubscriptionService' },
		{ id: 'subscribe', title: 'subscribe()' },
		{ id: 'graphql-transport-ws', title: 'graphql-transport-ws Protocol' },
	];

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
