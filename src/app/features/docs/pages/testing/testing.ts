import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-testing',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './testing.html',
	styleUrl: './testing.scss',
})
export class DocsTesting {
	private readonly tocService = inject(TocService);

	protected readonly versionService = inject(VersionService);

	protected readonly packageSince = this.versionService.getPackageSince('@dumbql/testing');

	protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/testing/src/lib';

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API'];

	protected readonly apiEntries: ApiEntry[] = [
		{
			name: 'MockGraphqlService',
			description:
				'Injectable mock GraphQL service for testing. Intercepts queries and mutations, returning configured responses.',
			type: 'class',
		},
		{
			name: 'MockGraphqlService.when(request, result)',
			description:
				'Registers a mock response for a specific query and variables combination. Responses are consumed in FIFO order.',
			type: 'method',
		},
		{
			name: 'MockGraphqlService.query(document, variables?)',
			description: 'Mocks a GraphQL query execution, returning the configured response or a default error.',
			type: 'method',
		},
		{
			name: 'MockGraphqlService.mutate(document, variables?)',
			description: 'Mocks a GraphQL mutation execution.',
			type: 'method',
		},
		{ name: 'MockGraphqlService.refetch(document, variables?)', description: 'Mocks a query refetch.', type: 'method' },
		{
			name: 'MockGraphqlService.poll(document, intervalMs, variables?)',
			description: 'Mocks a polling query execution.',
			type: 'method',
		},
		{
			name: 'MockedResponse',
			description: 'Interface for a configured mock response with optional simulated delay.',
			type: 'interface',
		},
		{
			name: 'MockedResponse.request',
			description: 'The MockedRequest that this response matches against.',
			type: 'property',
		},
		{
			name: 'MockedResponse.result',
			description: 'The GraphQLResult data to return for this response.',
			type: 'property',
		},
		{
			name: 'MockedResponse.delay',
			description: 'Optional delay in milliseconds before the response is emitted.',
			type: 'property',
		},
		{
			name: 'MockedRequest',
			description: 'Interface describing a GraphQL operation request with query string and optional variables.',
			type: 'interface',
		},
		{ name: 'MockedRequest.query', description: 'The GraphQL query string.', type: 'property' },
		{ name: 'MockedRequest.variables', description: 'Optional variables for the request.', type: 'property' },
		{
			name: 'provideDumbqlTesting()',
			description: 'Angular provider function that registers MockGraphqlService for injection in tests.',
			type: 'function',
		},
	];

	protected readonly tocSections: TocSection[] = [
		{ id: 'mock-provider', title: 'provideDumbqlMock' },
		{ id: 'mock-link', title: 'MockGraphqlLink' },
		{ id: 'behavior-verification', title: 'Behavior Verification' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}

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
