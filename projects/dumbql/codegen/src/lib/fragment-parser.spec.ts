import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseFragmentFile, generateFragmentCode } from './fragment-parser';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('parseFragmentFile', () => {
  const tmpDir = join(tmpdir(), 'dumbql-fragment-test-' + Date.now());
  const fixturePath = join(tmpDir, 'fragments.graphql');

  beforeAll(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('parses a simple fragment', () => {
    writeFileSync(fixturePath, `
      fragment BookFields on Book {
        id
        title
        author
      }
    `);
    const result = parseFragmentFile(fixturePath);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(1);
    expect(result![0].name).toBe('BookFields');
    expect(result![0].typeCondition).toBe('Book');
    expect(result![0].fields).toEqual(['id', 'title', 'author']);
  });

  it('parses a fragment with nested fields', () => {
    writeFileSync(fixturePath, `
      fragment BookWithAuthor on Book {
        id
        title
        author {
          name
          avatar
        }
      }
    `);
    const result = parseFragmentFile(fixturePath);
    expect(result![0].fields).toContain('id');
    expect(result![0].fields).toContain('title');
    expect(result![0].fields).toContain('author');
  });

  it('parses multiple fragments in one file', () => {
    writeFileSync(fixturePath, `
      fragment BookFields on Book { id title }
      fragment AuthorFields on Author { name avatar }
    `);
    const result = parseFragmentFile(fixturePath);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0].name).toBe('BookFields');
    expect(result![1].name).toBe('AuthorFields');
  });

  it('returns null for operations-only file', () => {
    writeFileSync(fixturePath, `
      query GetBooks { books { id title } }
    `);
    const result = parseFragmentFile(fixturePath);
    expect(result).toBeNull();
  });

  it('returns null for invalid GraphQL', () => {
    writeFileSync(fixturePath, 'this is not graphql');
    const result = parseFragmentFile(fixturePath);
    expect(result).toBeNull();
  });
});

describe('generateFragmentCode', () => {
  it('generates TypeScript code for a fragment', () => {
    const code = generateFragmentCode([
      { name: 'BookFields', typeCondition: 'Book', fields: ['id', 'title', 'author'], inlineFragments: [], document: 'fragment BookFields on Book { id title author }', filePath: '' },
    ], 'export interface Book { id: string; title: string; author: string; }');
    expect(code).toContain('export type BookFieldsFragment = Pick<Book');
    expect(code).toContain("'id' | 'title' | 'author'");
    expect(code).toContain('export const BookFields: TypedDocumentNode<BookFieldsFragment');
  });
});
