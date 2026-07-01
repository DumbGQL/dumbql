import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiNotification } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { RouterLink } from '@angular/router';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';
import { CodeSandboxStarterService } from '../../../../shared/codesandbox/codesandbox-starter.service';

@Component({
  selector: 'app-docs-getting-started',
  standalone: true,
  imports: [TuiNotification, TuiBadge, RouterLink, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
})
export class DocsGettingStarted {
  protected readonly versionService = inject(VersionService);
  protected readonly sandbox = inject(CodeSandboxStarterService);

  protected readonly tocSections: TocSection[] = [
    { id: 'install', title: 'Install' },
    { id: 'configure', title: 'Configure' },
    { id: 'first-query', title: 'Your First Query' },
    { id: 'starters', title: 'Starters' },
    { id: 'next-steps', title: 'Next Steps' },
  ];

  protected readonly installCode = 'npm install @dumbql/client';

  protected readonly configureCode = `import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

// Use with any framework:
// - React: <DumbqlProvider client={client}>…
// - Vue:   app.use(createDumbqlPlugin(client))
// - Angular: import { provideGraphql } from '@dumbql/core'`;

  protected readonly firstQueryCode = `import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const BOOKS_QUERY = gql\`query Books { books { id title } }\`;

const result = await client.query<{ books: Book[] }>(BOOKS_QUERY);
if (isSuccess(result)) {
  console.log(result.data.books);
}`;
}
