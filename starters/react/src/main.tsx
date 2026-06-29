import React from 'react';
import ReactDOM from 'react-dom/client';
import { DumbqlProvider } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';
import App from './App';

const client = createClient({ endpoint: 'http://localhost:4000/graphql' });
const cache = createCache();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DumbqlProvider client={client} cache={cache}>
      <App />
    </DumbqlProvider>
  </React.StrictMode>,
);
