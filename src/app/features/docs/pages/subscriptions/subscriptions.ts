import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-subscriptions',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './subscriptions.html',
	styleUrl: './subscriptions.scss',
})
export class DocsSubscriptions {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/subscriptions');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/subscriptions/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'GraphqlSubscription', description: 'Framework-agnostic WebSocket subscription class. Manages a single subscription lifecycle over the graphql-transport-ws protocol.', type: 'class' },
  	{ name: 'GraphqlSubscription.constructor', description: 'Creates a new GraphqlSubscription with the GraphQL endpoint URL.', type: 'constructor', default: 'endpoint: string' },
  	{ name: 'GraphqlSubscription.subscribe(query, variables?, callbacks?)', description: 'Opens a WebSocket connection, subscribes to the given query, and returns an unsubscribe function.', type: 'method' },
  	{ name: 'GraphqlLiveQuery', description: 'Framework-agnostic class combining initial HTTP query fetch with WebSocket subscription for real-time updates.', type: 'class' },
  	{ name: 'GraphqlSubscriptionService', description: 'Injectable Angular service wrapping GraphqlSubscription. Returns RxJS Observables for subscription data.', type: 'class' },
  	{ name: 'GraphqlSubscriptionService.subscribe(document, variables?)', description: 'Subscribes to a GraphQL subscription and returns an Observable that emits on each server push.', type: 'method', default: 'document: DocumentNode, variables?: Record<string, unknown>' },
  	{ name: 'subscribe(document, variables?)', description: 'Standalone injectable function that returns an Observable for a GraphQL subscription using GraphqlSubscriptionService.', type: 'function' },
  	{ name: 'provideDumbqlSubscriptions(config?)', description: 'Angular provider function that configures WebSocket URL, connection params, and reconnect settings.', type: 'function' },
  	{ name: 'SubscriptionsConfig', description: 'Configuration interface for the subscriptions provider.', type: 'interface' },
  	{ name: 'SubscriptionsConfig.wsUrl', description: 'WebSocket endpoint URL for GraphQL subscriptions.', type: 'property' },
  	{ name: 'SubscriptionsConfig.connectionParams', description: 'Function returning connection parameters sent during WebSocket initialization (e.g. auth tokens).', type: 'property' },
  	{ name: 'SubscriptionsConfig.reconnect', description: 'Whether to automatically reconnect on WebSocket disconnection.', type: 'property', default: 'false' },
  	{ name: 'SubscriptionsConfig.reconnectInterval', description: 'Interval in milliseconds between reconnection attempts.', type: 'property', default: '1000' },
  	{ name: 'SubscriptionsConfig.maxReconnectAttempts', description: 'Maximum number of reconnection attempts before giving up.', type: 'property', default: '10' },
  	{ name: 'SUBSCRIPTIONS_CONFIG', description: 'Angular InjectionToken used to provide SubscriptionsConfig to the subscriptions service.', type: 'constant' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'graphql-subscription-service', title: 'GraphqlSubscriptionService' },
  	{ id: 'subscribe', title: 'subscribe()' },
  	{ id: 'graphql-transport-ws', title: 'graphql-transport-ws Protocol' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
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

  protected readonly subStarters: StarterCodes = {
    vanilla: `import { createClient, gql } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});

const ON_MESSAGE = gql\`subscription OnMessage {
  messageAdded { id content createdAt }
}\`;

(async () => {
  for await (const result of client.subscribe(ON_MESSAGE)) {
    if (result.status === 'success') {
      console.log('New message:', result.data.messageAdded);
    }
  }
})();
`,
    angular: `import { provideDumbql, GraphqlSubscriptionService } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
  ],
};

@Component({ ... })
export class ChatComponent implements OnInit {
  private subs = inject(GraphqlSubscriptionService);
  messages: string[] = [];

  ngOnInit() {
    this.subs.subscribe(gql\`subscription OnMessage {
      messageAdded { id content }
    }\`).subscribe(({ data }) => {
      if (data?.messageAdded) {
        this.messages.push(data.messageAdded.content);
      }
    });
  }
}
`,
    react: `import { DumbqlProvider, useSubscription, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});

function Chat() {
  const { data } = useSubscription(gql\`subscription OnMessage {
    messageAdded { id content }
  }\`);

  return <p>Latest: {data?.messageAdded?.content ?? 'waiting...'}</p>;
}

function App() {
  return <DumbqlProvider client={client}><Chat /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useSubscription, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({
  endpoint: '/graphql',
  wsEndpoint: 'ws://localhost:4000/graphql',
});
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const { data } = useSubscription(gql\`subscription OnMessage {
  messageAdded { id content }
}\`);
</script>

<template>
  <p>Latest: {{ data?.messageAdded?.content ?? 'waiting...' }}</p>
</template>
`,
  };
}
