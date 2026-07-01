import { createYoga, createSchema } from 'graphql-yoga';
import { createServer } from 'http';

createServer(
  createYoga({
    schema: createSchema({
      typeDefs: `
        type Query { getNotes: [Note!]! }
        type Note { id: ID! title: String! content: String! }
      `,
    }),
    graphqlEndpoint: '/graphql',
  }),
).listen(4000, () => console.log('Mock GraphQL: http://localhost:4000/graphql'));
