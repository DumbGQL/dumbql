import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-api',
	standalone: true,
	imports: [TuiBadge, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './api.html',
	styleUrl: './api.scss',
})
export class DocsApi {
	protected readonly tocSections: TocSection[] = [
		{ id: 'client', title: '@dumbql/client' },
		{ id: 'react', title: '@dumbql/react' },
		{ id: 'vue', title: '@dumbql/vue' },
		{ id: 'core', title: '@dumbql/core' },
		{ id: 'cache', title: '@dumbql/cache' },
		{ id: 'subscriptions', title: '@dumbql/subscriptions' },
		{ id: 'file-upload', title: '@dumbql/file-upload' },
		{ id: 'middlewares', title: '@dumbql/middlewares' },
		{ id: 'pagination', title: '@dumbql/pagination' },
		{ id: 'persisted-queries', title: '@dumbql/persisted-queries' },
		{ id: 'fragments', title: '@dumbql/fragments' },
		{ id: 'ssr', title: '@dumbql/ssr' },
		{ id: 'debugging', title: '@dumbql/debugging' },
		{ id: 'downloader', title: '@dumbql/downloader' },
		{ id: 'testing', title: '@dumbql/testing' },
	];
}
