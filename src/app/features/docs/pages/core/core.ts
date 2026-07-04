import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { TuiNotification } from '@taiga-ui/core';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-core',
  standalone: true,
  imports: [TuiBadge, TuiNotification, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './core.html',
  styleUrl: './core.scss',
})
export class DocsCore {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/core');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/core/src/lib';

  protected readonly graphqlServiceCode = `const posts = this.graphql.query(
  gql\`query Posts { posts { id title } }\`,
); // → Signal<Post[]>

const mutation = this.graphql.mutate(
  gql\`mutation CreatePost($input: PostInput!) {
    createPost(input: $input) { id title }
  }\`,
); // → MutationRef<Post>`;

  protected readonly mutationCode = `const createPost = this.graphql.mutate(
  gql\`mutation CreatePost($input: PostInput!) {
    createPost(input: $input) { id title }
  }\`,
);

// trigger when ready
createPost.mutate({ input: { title: 'Hello' } });`;

  protected readonly refetchCode = `service.refetch(GET_CURRENT_USER).subscribe((r) => {
  console.log('Refetched:', r);
});`;

  protected readonly middlewareCode = `import { authRefreshMiddleware } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefreshMiddleware({ refreshToken: () => inject(AuthService).token() }),
  createHttpLink({ uri: '/graphql' }),
);`;

  protected readonly standaloneCode = `import { executeQuery, buildRequest, parseResult } from '@dumbql/core';

const request = buildRequest(gql\`query { ping }\`);
const result = await executeQuery({ uri: '/graphql' }, request);`;

  protected readonly standaloneInjectCode = `import { query, mutate } from '@dumbql/core';

// Must be called from an injection context (component, directive, service, or TestBed.runInInjectionContext)
const result = query(gql\`query Books { books { id title } }\`);
// → Observable<GraphQLResult<{ books: Book[] }>>

const mutationResult = mutate(gql\`mutation LikePost($id: ID!) { likePost(id: $id) { likes } }\`);
// → Observable<GraphQLResult<{ likePost: Post }>>`;

  protected readonly gqlTagCode = `const BOOKS_QUERY = gql\`query Books {
  books { id title author { name } }
}\`;`;

  protected readonly reactiveVarCode = `const isAuthenticated = createReactiveVar(false);

// Update triggers all consuming queries to refetch
isAuthenticated.set(true);`;

  protected readonly clientDirectiveCode = `<div *dqlClient="let data = query(gql\`query { isLoggedIn @client }\`)">
  {{ data?.isLoggedIn ? 'Logged in' : 'Guest' }}
</div>`;

  protected readonly configurationCode = `export interface DumbqlCoreConfig {
  link: Link;
  routerRefetch?: boolean;
  defaultContext?: Record<string, unknown>;
  retryOnError?: boolean;
}`;

  protected readonly provideGraphqlCode = `import { provideGraphql } from '@dumbql/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGraphql({ endpoint: '/graphql' }),
  ],
};`;

  protected readonly pluginCode = `import { provideGraphql } from '@dumbql/core';

const loggingPlugin = {
  name: 'LoggingPlugin',
  onInit() { console.log('GraphQL initialized'); },
  getMiddleware() {
    return (request, next) => {
      console.log('Request:', request);
      return next(request);
    };
  },
};

provideGraphql({
  endpoint: '/graphql',
  plugins: [loggingPlugin],
});`;

  protected readonly appQueriesCode = `import { gql } from '@dumbql/core';

export const GET_CURRENT_USER = gql\`query GetCurrentUser {
  getCurrentUser { id username createdAt }
}\`;

export const GET_NOTES = gql\`query GetNotes($filter: NoteType) {
  getNotes(filter: $filter) { id title content noteType }
}\`;`;

  constructor() {
    this.tocService.sections.set([
      { id: 'dumbqlcore', title: '@dumbql/core' },
      { id: 'installation', title: 'Installation' },
      {
        id: 'graphqlservice',
        title: 'GraphqlService',
        children: [
          { id: 'query', title: 'Query' },
          { id: 'mutation', title: 'Mutation' },
          { id: 'refetch', title: 'Refetch' },
        ],
      },
      {
        id: 'middleware-pipeline',
        title: 'Middleware Pipeline',
        children: [{ id: 'built-in-middleware', title: 'Built-in Middleware' }],
      },
      { id: 'standalone-functions', title: 'Standalone Functions' },
      { id: 'gql-tag', title: 'gql Tag' },
      { id: 'reactive-variables', title: 'Reactive Variables' },
      { id: 'client-directive', title: 'Client Directive' },
      {
        id: 'configuration',
        title: 'Configuration',
        children: [
          { id: 'provide-graphql', title: 'provideGraphql' },
          { id: 'plugins', title: 'Plugins' },
          { id: 'api-reference', title: 'API Reference' },
        ],
      },
      { id: 'app-queries', title: 'App Queries' },
    ]);
  }
}
