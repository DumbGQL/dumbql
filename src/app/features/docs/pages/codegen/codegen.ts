import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-codegen',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './codegen.html',
	styleUrl: './codegen.scss',
})
export class DocsCodegen {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/codegen');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/codegen/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'dumbql-codegen CLI', description: 'CLI tool that scans schema and GraphQL documents, generates typed DocumentNode exports and fragment masking types.', type: 'cli' },
  	{ name: 'graphql`...` (generated)', description: 'Generated template tag that returns TypedDocumentNode with fully typed query results and variables.', type: 'function' },
  	{ name: 'FragmentRef<T> (generated)', description: 'Generated opaque fragment reference type that enforces data masking at the type level.', type: 'type' },
  	{ name: 'useFragment(fragment, ref) (generated)', description: 'Generated function that unwraps a FragmentRef to access the underlying fragment data.', type: 'function' },
  	{ name: 'generateSchemaTypes(schema, config?)', description: 'Generates TypeScript interface/type/enum code from schema introspection data.', type: 'function' },
  	{ name: 'generateSchemaFile(schema, outputPath, config?)', description: 'Generates schema types and writes to a file, with optional merge mode.', type: 'function' },
  	{ name: 'SchemaData', description: 'Schema introspection data with types and root operation types.', type: 'interface' },
  	{ name: 'SchemaData.types', description: 'Array of all schema types.', type: 'property' },
  	{ name: 'SchemaData.queryType', description: 'Root Query type name.', type: 'property' },
  	{ name: 'SchemaData.mutationType', description: 'Root Mutation type name.', type: 'property' },
  	{ name: 'SchemaData.subscriptionType', description: 'Root Subscription type name.', type: 'property' },
  	{ name: 'SchemaType', description: 'A single schema type with kind, fields, input fields, enum values.', type: 'interface' },
  	{ name: 'SchemaType.name', description: 'Type name.', type: 'property' },
  	{ name: 'SchemaType.kind', description: 'Type kind (OBJECT, INPUT_OBJECT, ENUM, UNION, etc.).', type: 'property' },
  	{ name: 'CodegenScalars', description: 'Custom scalar-to-TypeScript type mapping.', type: 'type' },
  	{ name: 'findGraphqlFiles(pattern)', description: 'Globs for GraphQL document files matching a pattern.', type: 'function' },
  	{ name: 'parseGraphqlFile(filePath)', description: 'Parses a .graphql file into a ParsedOperation.', type: 'function' },
  	{ name: 'ParsedOperation', description: 'Parsed operation with name, type, variables, document, and file path.', type: 'interface' },
  	{ name: 'ParsedOperation.name', description: 'Operation name.', type: 'property' },
  	{ name: 'ParsedOperation.type', description: 'Operation type: query, mutation, or subscription.', type: 'property' },
  	{ name: 'ParsedOperation.variables', description: 'Variable definitions with name and type.', type: 'property' },
  	{ name: 'ParsedOperation.document', description: 'Raw GraphQL document string.', type: 'property' },
  	{ name: 'ParsedOperation.filePath', description: 'Absolute file path.', type: 'property' },
  	{ name: 'OperationVar', description: 'A single operation variable with name and GraphQL type string.', type: 'interface' },
  	{ name: 'OperationVar.name', description: 'Variable name.', type: 'property' },
  	{ name: 'OperationVar.type', description: 'GraphQL type string (e.g. String!, [Int]).', type: 'property' },
  	{ name: 'generateTypedDocumentsCode(operations, schemaTypes?, options?, fragmentTypes?)', description: 'Generates typed DocumentNode exports from parsed operations.', type: 'function' },
  	{ name: 'DocumentCodegenOptions', description: 'Options for generating typed document code.', type: 'interface' },
  	{ name: 'DocumentCodegenOptions.prefix', description: 'Prefix for generated result type names.', type: 'property', default: '—' },
  	{ name: 'DocumentCodegenOptions.suffix', description: 'Suffix for generated result type names.', type: 'property', default: '—' },
  	{ name: 'DocumentCodegenOptions.clientPreset', description: 'Generate createTypedQuery() instead of gql tag.', type: 'property', default: 'false' },
  	{ name: 'FragmentTypeInfo', description: 'Metadata for a fragment type used in document generation.', type: 'interface' },
  	{ name: 'FragmentTypeInfo.name', description: 'Fragment name.', type: 'property' },
  	{ name: 'FragmentTypeInfo.keyName', description: 'Fragment key reference name.', type: 'property' },
  	{ name: 'FragmentTypeInfo.typeCondition', description: 'GraphQL type the fragment is on.', type: 'property' },
  	{ name: 'FragmentTypeInfo.importRelative', description: 'Relative import path to the fragment file.', type: 'property' },
  	{ name: 'generateIndexCode(operations)', description: 'Generates a barrel index file re-exporting all operations.', type: 'function' },
  	{ name: 'mergeGeneratedTypes(existingFilePath, newContent)', description: 'Merges new type definitions into existing file preserving line positions.', type: 'function' },
  	{ name: 'parseFragmentFile(filePath)', description: 'Parses a .graphql file extracting all fragment definitions.', type: 'function' },
  	{ name: 'ParsedFragment', description: 'A parsed GraphQL fragment with name, type condition, and fields.', type: 'interface' },
  	{ name: 'ParsedFragment.name', description: 'Fragment name.', type: 'property' },
  	{ name: 'ParsedFragment.typeCondition', description: 'GraphQL type the fragment applies to.', type: 'property' },
  	{ name: 'ParsedFragment.fields', description: 'Selected field names.', type: 'property' },
  	{ name: 'ParsedFragment.inlineFragments', description: 'Inline fragment type conditions.', type: 'property' },
  	{ name: 'ParsedFragment.document', description: 'Raw GraphQL document string.', type: 'property' },
  	{ name: 'ParsedFragment.filePath', description: 'Absolute file path.', type: 'property' },
  	{ name: 'generateFragmentCode(fragments, typesCode?, clientPreset?)', description: 'Generates typed fragment code with FragmentRef key types.', type: 'function' },
  	{ name: 'generateFragmentIndex(fragments)', description: 'Generates a barrel index file re-exporting all fragments.', type: 'function' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'overview', title: 'Overview' },
  	{ id: 'cli', title: 'CLI Usage' },
  	{ id: 'typed-documents', title: 'Typed Documents' },
  	{ id: 'fragment-masking', title: 'Fragment Masking' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly cliCode = 'npx dumbql-codegen --schema ./schema.graphql --documents \'./src/**/*.graphql\' --out ./src/gql/';

  protected readonly typedDocCode = `import { graphql } from '../gql';

const GET_TODOS = graphql(\`
  query GetTodos {
    todos { id title }
  }
\`);

// typeof GET_TODOS is TypedDocumentNode<GetTodosQuery, GetTodosQueryVariables>`;

  protected readonly fragmentMaskingCode = `import { graphql, FragmentRef, useFragment } from '../gql';

const TodoFields = graphql(\`
  fragment TodoFields on Todo {
    id title completed
  }
\`);

// FragmentRef ensures data masking at type level
function TodoItem({ todo }: { todo: FragmentRef<typeof TodoFields> }) {
  const data = useFragment(TodoFields, todo);
  return <p>{data.title}</p>;
}`;
}
