import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-dev-server',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dev-server.html',
  styleUrl: './dev-server.scss',
})
export class DocsDevServer {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/dev-server');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/dev-server/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'quick-start', title: 'Quick Start' },
    { id: 'configuration', title: 'Configuration' },
    { id: 'cli', title: 'CLI Options' },
    { id: 'api', title: 'Programmatic API' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly cliCode = 'npx dumbql-dev --proxy http://localhost:4200';

  protected readonly configCode = `{
  "mock": {
    "schema": "type Query { getNotes: [Note!]! } type Note { id: ID! title: String! content: String! }"
  },
  "proxy": {
    "target": "http://localhost:5173"
  }
}`;

  protected readonly programmaticCode = `import { createDevServer, startDevServer } from '@dumbql/dev-server';

const server = createDevServer({
  mock: {
    schema: 'type Query { ping: String }',
    resolvers: { Query: { ping: () => 'pong' } },
  },
  proxy: { target: 'http://localhost:4200' },
});

startDevServer({ port: 4000 });`;
}
