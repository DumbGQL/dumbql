import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-vue',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vue.html',
  styleUrl: './vue.scss',
})
export class DocsVue {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/vue');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/vue/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'composables', title: 'Composables' },
      { id: 'plugin', title: 'Vue Plugin' },
    ]);
  }

  protected readonly quickStartCode = `<script setup>
import { createDumbqlPlugin, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql\`query Todos { todos { id title } }\`;
const { data, loading, error, refetch } = useQuery(GET_TODOS);
<\/script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error }}</p>
  <ul v-else>
    <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>`;

  protected readonly mutationCode = `const ADD_TODO = gql\`mutation AddTodo($title: String!) {
  addTodo(title: $title) { id title }
}\`;

const { mutate, data, loading, error } = useMutation(ADD_TODO);

function handleSubmit() {
  mutate({ title: 'New Todo' });
}`;

  protected readonly subscriptionCode = `const { data } = useSubscription(
  gql\`subscription OnMessage { messageAdded { content } }\`,
);`;

  protected readonly pluginCode = `import { createApp } from 'vue';
import { createDumbqlPlugin } from '@dumbql/vue';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));
app.mount('#app');`;
}
