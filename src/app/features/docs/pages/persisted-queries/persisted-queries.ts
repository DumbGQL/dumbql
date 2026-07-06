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
	selector: 'app-docs-persisted-queries',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './persisted-queries.html',
	styleUrl: './persisted-queries.scss',
})
export class DocsPersistedQueries {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/persisted-queries');

  protected readonly githubUrl =
    'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/persisted-queries/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'apqMiddleware(config?)', description: 'Automatic Persisted Query middleware. First sends only the SHA-256 hash, retries with full query on PersistedQueryNotFound. Optionally uses GET for hashed queries.', type: 'function' },
  	{ name: 'PersistedQueryService', description: 'Injectable Angular service for executing queries through the persisted query middleware chain.', type: 'class' },
  	{ name: 'PersistedQueryService.execute(document, variables?)', description: 'Executes a GraphQL query through the persisted query pipeline.', type: 'method', default: 'document: DocumentNode, variables?: TVars' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'apq-middleware', title: 'APQ Middleware' },
  	{ id: 'wire-format', title: 'Wire Format' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly apqStarters: StarterCodes = {
    vanilla: `import { createClient, gql } from '@dumbql/client';
import { apqMiddleware } from '@dumbql/persisted-queries';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [apqMiddleware()],
});

async function run() {
  const result = await client.query(gql\`{ todos { id title } }\`);
  console.log(result);
}
`,
    angular: `import { provideDumbql } from '@dumbql/core';
import { apqMiddleware } from '@dumbql/persisted-queries';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({
      link: createHttpLink({ uri: '/graphql' }),
      middlewares: [apqMiddleware()],
    }),
  ],
};
`,
    react: `import { DumbqlProvider, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { apqMiddleware } from '@dumbql/persisted-queries';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [apqMiddleware()],
});

function Todos() {
  const { data } = useQuery(gql\`{ todos { id title } }\`);
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function App() {
  return <DumbqlProvider client={client}><Todos /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { apqMiddleware } from '@dumbql/persisted-queries';
import { createApp } from 'vue';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [apqMiddleware()],
});
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const { data } = useQuery(gql\`{ todos { id title } }\`);
</script>

<template>
  <pre>{{ data }}</pre>
</template>
`,
  };

  protected readonly apqMiddlewareCode = `import { apqMiddleware } from '@dumbql/persisted-queries';
import { composeMiddlewares, createHttpLink } from '@dumbql/core';

const link = composeMiddlewares(
  apqMiddleware(),
  createHttpLink({ uri: '/graphql' }),
);`;

  protected readonly sha256HashCode = `// What gets sent on the wire:
{
  "operationName": "Books",
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "9b6c6b8f0e9a1c3d7f5e2b4a8d0c6e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c"
    }
  }
}`;
}
