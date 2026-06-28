import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TuiNotification } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';

@Component({
	selector: 'app-docs-getting-started',
	standalone: true,
	imports: [TuiNotification, RouterLink, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './getting-started.html',
	styleUrl: './getting-started.scss',
})
export class DocsGettingStarted {
	protected readonly tocSections: TocSection[] = [
		{ id: 'install', title: 'Install' },
		{ id: 'configure', title: 'Configure' },
		{ id: 'first-query', title: 'Your First Query' },
		{ id: 'next-steps', title: 'Next Steps' },
	];

	protected readonly installCode = 'npm install @dumbql/core @dumbql/cache @dumbql/subscriptions';

	protected readonly configureCode = `import { provideDumbqlCore, provideDumbqlCache } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/links';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbqlCore({
      link: createHttpLink({ uri: '/graphql' }),
    }),
    provideDumbqlCache(),
  ],
};`;

	protected readonly firstQueryCode = `import { Component, inject } from '@angular/core';
import { GraphqlService, gql } from '@dumbql/core';

@Component({
  selector: 'app-books',
  standalone: true,
  template: \`<ul>
    @for (b of books(); track b.id) {
      <li>{{ b.title }}</li>
}
  </ul>\`,
})
export class BooksComponent {
  #graphql = inject(GraphqlService);

  readonly books = this.#graphql.query(
    gql\`query Books { books { id title } }\`,
  );
}`;
}
