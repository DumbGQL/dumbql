import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';

@Component({
  selector: 'app-docs-comparison',
  standalone: true,
  imports: [TuiBadge, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison.html',
  styleUrl: './comparison.scss',
})
export class DocsComparison {
  private readonly tocService = inject(TocService);

  constructor() {
    this.tocService.sections.set([
      { id: 'comparison', title: 'Comparison Table' },
      { id: 'fixed-bugs', title: 'Fixed Bugs & Issues' },
      { id: 'apollo-pain', title: 'Apollo Pain Points' },
      { id: 'relay-pain', title: 'Relay Pain Points' },
      { id: 'urql-pain', title: 'URQL Pain Points' },
      { id: 'industry-gaps', title: 'Industry Gaps' },
      { id: 'when-to-choose', title: 'When to Choose DumbQL' },
    ]);
  }
}
