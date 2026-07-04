import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-persisted-queries',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
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

  constructor() {
    this.tocService.sections.set([
      { id: 'apq-middleware', title: 'APQ Middleware' },
      { id: 'wire-format', title: 'Wire Format' },
    ]);
  }

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
