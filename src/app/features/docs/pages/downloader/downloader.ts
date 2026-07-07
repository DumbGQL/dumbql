import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-downloader',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './downloader.html',
	styleUrl: './downloader.scss',
})
export class DocsDownloader {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/downloader');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/downloader/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'downloadAndStoreSchema(options)', description: 'Downloads a GraphQL schema via introspection and saves schema.json and schema.graphql files. Returns paths to both files.', type: 'function' },
  	{ name: 'DownloaderOptions', description: 'Configuration interface for schema download with endpoint URL, output directory, optional filename, and headers.', type: 'interface' },
  	{ name: 'DownloaderOptions.endpoint', description: 'GraphQL endpoint URL to introspect.', type: 'property' },
  	{ name: 'DownloaderOptions.outputDir', description: 'Directory path where the schema files will be saved.', type: 'property' },
  	{ name: 'DownloaderOptions.filename', description: 'Custom filename for the schema JSON file. The SDL file derives its name from this.', type: 'property', default: 'schema.json' },
  	{ name: 'DownloaderOptions.headers', description: 'Additional HTTP headers for the introspection request (e.g. Authorization).', type: 'property' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'download-schema', title: 'downloadAndStoreSchema()' },
  	{ id: 'output-structure', title: 'Output Structure' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
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
