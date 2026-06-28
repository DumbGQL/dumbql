export { generateSchemaTypes, generateSchemaFile } from './lib/schema-types';
export type { SchemaData, SchemaType, CodegenScalars } from './lib/schema-types';

export {
	findGraphqlFiles,
	parseGraphqlFile,
	generateTypedDocumentsCode,
	generateIndexCode,
} from './lib/graphql-file-parser';
export type { ParsedOperation, OperationVar } from './lib/graphql-file-parser';

export { mergeGeneratedTypes } from './lib/schema-merge';
