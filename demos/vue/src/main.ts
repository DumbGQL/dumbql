import { createApp } from 'vue';
import { createClient } from '@dumbql/client';
import { createDumbqlPlugin } from '@dumbql/vue';
import App from './App.vue';

const client = createClient({
  endpoint: 'http://localhost:4000/graphql',
});

createApp(App)
  .use(createDumbqlPlugin(client))
  .mount('#app');
