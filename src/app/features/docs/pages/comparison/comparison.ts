import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-comparison',
	standalone: true,
	imports: [TuiBadge, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './comparison.html',
	styleUrl: './comparison.scss',
})
export class DocsComparison {
	protected readonly tocSections: TocSection[] = [
		{ id: 'comparison', title: 'Comparison Table' },
		{ id: 'apollo-pain', title: 'Apollo Pain Points' },
		{ id: 'relay-pain', title: 'Relay Pain Points' },
		{ id: 'urql-pain', title: 'URQL Pain Points' },
		{ id: 'industry-gaps', title: 'Industry Gaps' },
		{ id: 'when-to-choose', title: 'When to Choose DumbQL' },
	];
}
