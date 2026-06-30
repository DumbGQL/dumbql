import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@dumbql/client';
import { DumbqlProvider } from '@dumbql/react';
import { App } from './App';

const client = createClient({
  endpoint: '/graphql',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DumbqlProvider client={client}>
      <App />
    </DumbqlProvider>
  </StrictMode>,
);
