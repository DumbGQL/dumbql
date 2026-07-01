import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-downloader',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './downloader.html',
  styleUrl: './downloader.scss',
})
export class DocsDownloader {
  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/downloader');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/downloader/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'download-schema', title: 'downloadAndStoreSchema()' },
    { id: 'output-structure', title: 'Output Structure' },
  ];

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
