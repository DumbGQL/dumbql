import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-client',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './client.html',
  styleUrl: './client.scss',
})
export class DocsClient {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/client');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/client/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'api', title: 'API' },
      { id: 'middleware', title: 'Middleware' },
      { id: 'cache', title: 'Cache Integration' },
      { id: 'streaming', title: 'Streaming' },
      { id: 'file-upload', title: 'File Upload' },
    ]);
  }

  protected readonly quickStartCode = `import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql\`query Todos { todos { id title } }\`;

const result = await client.query<{ todos: Todo[] }>(GET_TODOS);
if (isSuccess(result)) {
  console.log(result.data.todos);
}`;

  protected readonly middlewareCode = `import { createClient, authMiddleware, loggingMiddleware } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middleware: [
    authMiddleware('my-token'),
    loggingMiddleware('Todos'),
  ],
});`;

  protected readonly cacheCode = `import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const cache = createCache();
const client = createClient({
  endpoint: '/graphql',
}, cache);`;

  protected readonly streamingCode = `const stream = client.queryStream(gql\`query Stream { ... }\`);

for await (const part of stream) {
  if (isSuccess(part)) {
    console.log('incremental:', part.data);
  }
}`;
}
