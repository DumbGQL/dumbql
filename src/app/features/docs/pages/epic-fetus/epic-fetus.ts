import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';

@Component({
	selector: 'app-docs-epic-fetus',
	standalone: true,
	imports: [TuiBadge, TuiTab, TuiTabs, DocsToc, AnchorDirective, DocsStackblitzStarterComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './epic-fetus.html',
	styleUrl: './epic-fetus.scss',
})
export class DocsEpicFetus {
	private readonly tocService = inject(TocService);

	protected readonly tocSections: TocSection[] = [
		{ id: 'what-is', title: 'What is Epic Fetus?' },
		{ id: 'how-it-works', title: 'How It Works' },
		{ id: 'disabling', title: 'Disabling Epic Fetus' },
		{ id: 'framework-adapters', title: 'Framework Adapters' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API', 'Starters'];

	protected readonly nullDetectionStarters: StarterCodes = {
		vanilla: `import { createClient, gql } from '@dumbql/client';
import { nullDetectionMiddleware } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [nullDetectionMiddleware()],
});

// The middleware logs null fields detected in responses
`,
		angular: `import { provideDumbql, provideNullDetection } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
    provideNullDetection(true), // shows overlay
  ],
};

// The overlay appears when null fields are detected
// Toggle with Ctrl+Shift+N
`,
		react: `import { DumbqlProvider, useEpicFetus, NullOverlay } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

function App() {
  const epicFetus = useEpicFetus();

  return (
    <DumbqlProvider client={client}>
      <MyComponent />
      <NullOverlay />
    </DumbqlProvider>
  );
}

// NullOverlay shows a fixed-position indicator
// when null fields are detected in GraphQL responses
`,
		vue: `import { createDumbqlPlugin, useEpicFetus, NullOverlay } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));

// In App.vue:
<script setup lang="ts">
useEpicFetus();
</script>

<template>
  <RouterView />
  <NullOverlay />
</template>

// NullOverlay shows a floating indicator
// when null fields are detected
`,
	};

	protected readonly nullOverlayCode = `import { provideNullDetection } from '@dumbql/core';
import { NullOverlay } from '@dumbql/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNullDetection(),
  ],
};`;

	protected readonly reactHookCode = `import { useEpicFetus } from '@dumbql/react';

function App() {
  const detection = useEpicFetus();

  return (
    <div>
      {detection && (
        <p>Null value at: {detection.path}</p>
      )}
    </div>
  );
}`;

	protected readonly vueComposableCode = `<script setup>
import { useEpicFetus } from '@dumbql/vue';

const detection = useEpicFetus();
<\/script>`;

	protected readonly extensionDisableCode = `// In the browser extension popup, toggle:
// "Enable null detection animation" → OFF

// Or remove the extension entirely.`;

	protected readonly configDisableCode = `// Angular — simply omit the provider:
import { provideGraphql } from '@dumbql/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // Don't call provideNullDetection() — no overlay, no middleware
    provideGraphql({ endpoint: '/graphql' }),
  ],
};`;
}
