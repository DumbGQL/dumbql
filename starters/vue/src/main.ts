import { createApp } from 'vue';
import { createDumbqlPlugin } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import App from './App.vue';

const client = createClient({ endpoint: '/graphql' });

const app = createApp(App);
app.use(createDumbqlPlugin(client));
app.mount('#app');
