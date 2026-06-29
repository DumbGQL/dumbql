import { createServer } from 'node:http';

const notes = [
  { id: '1', title: 'Hello DumbQL', content: 'Your first GraphQL query works!' },
  { id: '2', title: 'Zero Boilerplate', content: 'No decorators, no resolvers, no codegen needed.' },
  { id: '3', title: 'Modular by Design', content: 'Use only what you need: cache, subscriptions, uploads, etc.' },
];

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/graphql') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { query } = JSON.parse(body);
      if (query?.includes('getNotes')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: { getNotes: notes } }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ errors: [{ message: 'Unknown query' }] }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(4000, () => console.log('Mock GraphQL API at http://localhost:4000/graphql'));
