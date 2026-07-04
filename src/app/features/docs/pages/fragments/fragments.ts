import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-fragments',
  standalone: true,
  imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fragments.html',
  styleUrl: './fragments.scss',
})
export class DocsFragments {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/fragments');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/fragments/src/lib';

  protected readonly tocSections: TocSection[] = [
    { id: 'fragment', title: 'fragment()' },
    { id: 'spread', title: 'spread()' },
    { id: 'compose', title: 'compose()' },
    { id: 'use-fragment', title: 'useFragment()' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly fragmentCode = `import { fragment } from '@dumbql/fragments';

const BOOK_FIELDS = fragment('Book', gql\`fragment BookFields on Book {
  id
  title
  author { name }
  price
}\`);`;

  protected readonly spreadCode = `import { spread } from '@dumbql/fragments';

const BOOKS_QUERY = gql\`query Books {
  books { ...BookFields }
}\${spread(BOOK_FIELDS)}\`;`;

  protected readonly composeCode = `import { compose } from '@dumbql/fragments';

const AUTHOR_FIELDS = fragment('Author', gql\`fragment AuthorFields on Author {
  id name books { ...BookFields }
}\`);

const fullDocument = compose([BOOK_FIELDS, AUTHOR_FIELDS]);`;

  protected readonly useFragmentCode = `import { useFragment } from '@dumbql/fragments';

@Component({
  selector: 'app-book-card',
  standalone: true,
  template: \`<div>{{ book()?.title }} by {{ book()?.author?.name }}</div>\`,
})
export class BookCardComponent {
  book = useFragment(BOOK_FIELDS, this.graphql.query(BOOKS_QUERY));
}`;
}
