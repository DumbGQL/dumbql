import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-testing',
	standalone: true,
	imports: [TuiBadge, TuiChip, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './testing.html',
	styleUrl: './testing.scss',
})
export class DocsTesting {
	protected readonly versionService = inject(VersionService);

	protected readonly tocSections: TocSection[] = [
		{ id: 'mock-provider', title: 'provideDumbqlMock' },
		{ id: 'mock-link', title: 'MockGraphqlLink' },
		{ id: 'behavior-verification', title: 'Behavior Verification' },
	];

	protected readonly mockProviderCode = `import { provideDumbqlMock } from '@dumbql/testing';

TestBed.configureTestingModule({
  providers: [
    provideDumbqlMock({
      'Books': { data: { books: [{ id: '1', title: 'Dune' }] } },
    }),
  ],
});`;

	protected readonly mockLinkCode = `import { MockGraphqlLink } from '@dumbql/testing';

const mockLink = new MockGraphqlLink();
mockLink.setResponse('Books', {
  data: { books: [{ id: '1', title: 'Dune' }] },
});

TestBed.configureTestingModule({
  providers: [
    provideDumbqlCore({ link: mockLink }),
  ],
});`;

	protected readonly behaviorVerificationCode = `const mockLink = new MockGraphqlLink();

// After test runs:
expect(mockLink.operations.length).toBe(1);
expect(mockLink.operations[0].operationName).toBe('Books');
expect(mockLink.operations[0].variables).toEqual({ limit: 10 });`;
}
