import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-ssr',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './ssr.html',
	styleUrl: './ssr.scss',
})
export class DocsSsr {
	protected readonly tocSections: TocSection[] = [
		{ id: 'setup', title: 'SSR Setup' },
		{ id: 'transfer-cache', title: 'Transfer Cache' },
		{ id: 'chunked-transfer', title: 'Chunked Transfer' },
	];

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
