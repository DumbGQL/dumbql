import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-pagination',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class DocsPagination {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/pagination');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/pagination/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'offset-pagination', title: 'offsetPagination' },
    { id: 'cursor-pagination', title: 'cursorPagination' },
    { id: 'merge-functions', title: 'Merge Functions' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly offsetPaginationCode = `import { offsetPagination } from '@dumbql/pagination';
import { provideDumbqlCache } from '@dumbql/cache';

provideDumbqlCache({
  typePolicies: {
    BooksConnection: {
      merge: offsetPagination({ offsetField: 'page', limitField: 'limit' }),
    },
  },
});`;

  protected readonly cursorPaginationCode = `import { cursorPagination } from '@dumbql/pagination';

provideDumbqlCache({
  typePolicies: {
    PostConnection: {
      merge: cursorPagination({
        cursorField: 'cursor',
        edgesField: 'edges',
        pageInfoField: 'pageInfo',
      }),
    },
  },
});`;

  protected readonly customMergeCode = `// Custom merge example
provideDumbqlCache({
  typePolicies: {
    Comments: {
      merge: (existing, incoming, { args }) => {
        if (!existing) return incoming;
        return {
          ...incoming,
          items: args?.refresh
            ? incoming.items
            : [...existing.items, ...incoming.items],
        };
      },
    },
  },
});`;
}
