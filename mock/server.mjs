import { createYoga, createSchema } from 'graphql-yoga';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, '..', 'graphql', 'schema.graphql'), 'utf-8');

const users = [
  { id: '550e8400-e29b-41d4-a716-446655440000', username: 'demo', password: 'demo123', masterKey: '', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-06-01T12:00:00Z' },
  { id: '550e8400-e29b-41d4-a716-446655440001', username: 'admin', password: 'admin123', masterKey: 'mk-admin', createdAt: '2026-02-20T08:30:00Z', updatedAt: '2026-06-15T14:00:00Z' },
];

const notes = [
  { id: '660e8400-e29b-41d4-a716-446655440010', title: 'Welcome', content: 'Welcome to DumbQL Keystore!', description: 'Getting started guide', iconUrl: null, noteType: 'NOTE', createdAt: '2026-06-01T10:00:00Z', updatedAt: null, author: users[0] },
  { id: '660e8400-e29b-41d4-a716-446655440011', title: 'GraphQL Basics', content: 'GraphQL is a query language for APIs.', description: 'Learn the fundamentals', iconUrl: null, noteType: 'NOTE', createdAt: '2026-06-02T11:00:00Z', updatedAt: '2026-06-10T09:00:00Z', author: users[0] },
  { id: '660e8400-e29b-41d4-a716-446655440012', title: 'API Keys', content: 'Production API key: sk-...', description: 'Sensitive credentials', iconUrl: null, noteType: 'PASSWORD', createdAt: '2026-06-05T15:00:00Z', updatedAt: null, author: users[1] },
];

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers: {
      UUID: {
        __serialize(val) { return String(val); },
        __parse(val) { return String(val); },
      },
      Upload: {
        __serialize(val) { return val; },
        __parse(val) { return val; },
      },
      Query: {
        getCurrentUser: () => users[0],
        getNotes(_, args) {
          if (!args.filter) return notes;
          return notes.filter((n) => n.noteType === args.filter);
        },
        getNoteDetails(_, args) {
          const note = notes.find((n) => n.id === args.id);
          if (!note) throw new Error(`Note ${args.id} not found`);
          return note;
        },
      },
      Mutation: {
        createUser(_, args) {
          const newUser = { id: crypto.randomUUID(), ...args.input, masterKey: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          users.push(newUser);
          return newUser;
        },
        updateUser(_, args) {
          return { ...users[0], ...args.input, updatedAt: new Date().toISOString() };
        },
        deleteUser: () => true,
        setMasterKey(_, args) {
          return { ...users[0], masterKey: args.masterKey, updatedAt: new Date().toISOString() };
        },
        createNote(_, args) {
          const newNote = { id: crypto.randomUUID(), ...args.input, iconUrl: null, createdAt: new Date().toISOString(), updatedAt: null, author: users[0] };
          notes.push(newNote);
          return newNote;
        },
        updateNote(_, args) {
          return { ...notes[0], ...args.input, updatedAt: new Date().toISOString() };
        },
        deleteNote: () => true,
      },
    },
  }),
  cors: { origin: ['http://localhost:4200'], credentials: true },
});

const server = createServer(yoga);
const port = 4000;
server.listen(port, () => {
  console.log(`Mock GraphQL server running at http://localhost:${port}/graphql`);
});
