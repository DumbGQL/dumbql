import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-ssr',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './ssr.html',
	styleUrl: './ssr.scss',
})
export class DocsSsr {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/ssr');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/ssr/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'SsrStreamService', description: 'Injectable service for progressive SSR transfer of GraphQL data. Splits large payloads into chunks for faster TTFB.', type: 'class' },
  	{ name: 'SsrStreamService.writeChunked(key, data)', description: 'Serializes data to Angular TransferState under a prefixed key.', type: 'method' },
  	{ name: 'SsrStreamService.readChunked(key)', description: 'Reads chunked data from Angular TransferState by key.', type: 'method' },
  	{ name: 'SsrStreamService.clear()', description: 'Clears all GQL-related TransferState entries.', type: 'method' },
  	{ name: 'SsrStreamConfig', description: 'Configuration interface for SSR stream options with custom key prefix and chunk size.', type: 'interface' },
  	{ name: 'SsrStreamConfig.key', description: 'Key prefix for TransferState entries.', type: 'property', default: 'gql' },
  	{ name: 'SsrStreamConfig.chunkSize', description: 'Chunk size in bytes for progressive loading.', type: 'property' },
  	{ name: 'SSR_STREAM_KEY', description: 'Angular InjectionToken used to provide SsrStreamConfig to the SSR stream service.', type: 'constant' },
  	{ name: 'TransferCacheService', description: 'Injectable service that saves cache state on the server and restores it on the browser during SSR hydration.', type: 'class' },
  	{ name: 'TransferCacheService.save(cache)', description: 'Serializes and saves cache state for transfer to the browser. No-op on the browser side.', type: 'method' },
  	{ name: 'TransferCacheService.restore(cache)', description: 'Restores cache state from SSR transfer data. Returns true on success.', type: 'method' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'setup', title: 'SSR Setup' },
  	{ id: 'transfer-cache', title: 'Transfer Cache' },
  	{ id: 'chunked-transfer', title: 'Chunked Transfer' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly ssrStreamServiceCode = `import { provideDumbqlSsr } from '@dumbql/ssr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbqlCore({ link: createHttpLink({ uri: '/graphql' }) }),
    provideDumbqlSsr(),
  ],
};`;

  protected readonly transferCacheCode = `// Server: results are embedded as <script> JSON
// Client: hydration happens automatically
// No configuration needed beyond provideDumbqlSsr()`;

  protected readonly chunkedTransferCode = `provideDumbqlSsr({
  chunked: true,
  chunkSize: 8192, // 8 kB per chunk
  flushOnNavigation: true, // flush pending queries on route change
});`;
}
