import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-downloader',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './downloader.html',
  styleUrl: './downloader.scss',
})
export class DocsDownloader {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/downloader');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/downloader/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'download-schema', title: 'downloadAndStoreSchema()' },
      { id: 'output-structure', title: 'Output Structure' },
    ]);
  }

  protected readonly downloadSchemaCode = `import { downloadAndStoreSchema } from '@dumbql/downloader';

const result = await downloadAndStoreSchema({
  url: 'https://api.example.com/graphql',
  headers: { Authorization: \`Bearer \${token}\` },
  outputDir: './schema',
});

console.log(result);
// {
//   introspectionUrl: '/schema/schema.json',
//   sdlUrl: '/schema/schema.graphql',
//   timestamp: '2025-06-27T12:00:00Z',
// }`;

  protected readonly outputStructureCode = `// Output structure
schema/
├── schema.json       # Raw introspection result
├── schema.graphql    # SDL format
└── meta.json         # Metadata (timestamp, url, query count)`;
}
