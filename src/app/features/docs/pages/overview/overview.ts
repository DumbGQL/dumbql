import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiNotification, TuiButton } from '@taiga-ui/core';
import { Logo } from '../../../../shared/ui/logo/logo';
import { DocFeatureCard } from '../../../../shared/ui/doc-feature-card/doc-feature-card';
import { DocsToc, type TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';

interface Feature {
	icon: string;
	title: string;
	description: string;
	link: string;
}

@Component({
	selector: 'app-docs-overview',
	standalone: true,
	imports: [RouterLink, TuiNotification, TuiButton, Logo, DocFeatureCard, DocsToc, AnchorDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './overview.html',
	styleUrl: './overview.scss',
})
export class DocsOverview {
	protected readonly features: Feature[] = [
		{
			icon: '⚡', title: '@dumbql/core',
			description: 'GraphqlService, middleware, gql tag, pipes, standalone helpers, reactive variables.',
			link: '/docs/core',
		},
		{
			icon: '💾', title: '@dumbql/cache',
			description: 'Normalized cache, optimistic updates, GC, persistence, type policies.',
			link: '/docs/cache',
		},
		{
			icon: '🔌', title: '@dumbql/subscriptions',
			description: 'WebSocket subscriptions via graphql-transport-ws with auto-reconnect.',
			link: '/docs/subscriptions',
		},
		{
			icon: '📎', title: '@dumbql/file-upload',
			description: 'Multipart upload spec, auto File/Blob detection, progress tracking.',
			link: '/docs/file-upload',
		},
		{
			icon: '🔀', title: '@dumbql/middlewares',
			description: 'Auth refresh, retry, focus refetch, offline queue — composable.',
			link: '/docs/middlewares',
		},
		{
			icon: '📄', title: '@dumbql/pagination',
			description: 'Offset, cursor, and relay-style pagination helpers.',
			link: '/docs/pagination',
		},
		{
			icon: '⚡', title: '@dumbql/persisted-queries',
			description: 'APQ middleware with SHA-256 hashing and auto-registration.',
			link: '/docs/persisted-queries',
		},
		{
			icon: '🧩', title: '@dumbql/fragments',
			description: 'Fragment composition, spread, useFragment for data masking.',
			link: '/docs/fragments',
		},
		{
			icon: '🖥️', title: '@dumbql/ssr',
			description: 'SSR stream service, transfer state cache, chunked transfer.',
			link: '/docs/ssr',
		},
		{
			icon: '🔍', title: '@dumbql/debugging',
			description: 'Operation inspector, field tree parser, mutation chart.',
			link: '/docs/debugging',
		},
		{
			icon: '📦', title: '@dumbql/downloader',
			description: 'Introspection to JSON + SDL, schema download & store.',
			link: '/docs/downloader',
		},
		{
			icon: '🧪', title: '@dumbql/testing',
			description: 'MockGraphqlService, when/respond, testing utilities.',
			link: '/docs/testing',
		},
	];

	protected readonly tocSections: TocSection[] = [
		{ id: 'overview', title: 'Overview' },
		{ id: 'packages', title: 'Packages' },
		{ id: 'why-dumbql', title: 'Why DumbQL?' },
		{ id: 'getting-started', title: 'Getting Started' },
	];
}
