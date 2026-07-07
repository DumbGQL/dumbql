import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-file-upload',
  standalone: true,
  imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class DocsFileUpload {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/file-upload');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/file-upload/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly apiEntries: ApiEntry[] = [
    {
      name: 'UploadService',
      description:
        'Injectable Angular service that wraps GraphQL mutations with automatic multipart encoding for File/Blob values.',
      type: 'class',
    },
    {
      name: 'UploadService.upload(document, variables)',
      description:
        'Uploads a file-backed mutation. Detects File/Blob values, builds multipart FormData, and POSTs to the GraphQL endpoint.',
      type: 'method',
      default: 'document: DocumentNode, variables: Record<string, unknown>',
    },
    {
      name: 'FileEntry',
      description: 'Interface representing a single file entry extracted from mutation variables.',
      type: 'interface',
    },
    {
      name: 'FileEntry.path',
      description: 'Dot-notation path to the file within the variables object (e.g. variables.avatar).',
      type: 'property',
    },
    { name: 'FileEntry.file', description: 'The File or Blob object.', type: 'property' },
    {
      name: 'hasFiles(value)',
      description: 'Recursively checks if a value or any nested value is a File or Blob instance.',
      type: 'function',
    },
  ];

  protected readonly tocSections: TocSection[] = [
    { id: 'upload-service', title: 'UploadService' },
    { id: 'multipart-spec', title: 'Multipart Spec' },
    { id: 'auto-detection', title: 'Auto Detection' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly uploadServiceCode = `import { UploadService, gql } from '@dumbql/file-upload';

const upload = inject(UploadService);

const result = await upload.mutate(
  gql\`mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) { url size }
  }\`,
  { file: fileInputElement.files[0] },
);`;

  protected readonly autoFileDetectionCode = `const result = await upload.mutate(
  gql\`mutation UploadAvatar($avatar: Upload!, $metadata: AvatarInput!) {
    uploadAvatar(avatar: $avatar, metadata: $metadata) { url }
  }\`,
  {
    avatar: fileInput.files[0],
    metadata: { userId: '123', crop: { x: 0, y: 0, w: 200, h: 200 } },
  },
);`;

  protected readonly uploadStarters: StarterCodes = {
    vanilla: `import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const UPLOAD = gql\`mutation Upload($file: Upload!) {
  uploadFile(file: $file) { url filename }
}\`;

async function uploadFile(file: File) {
  const result = await client.mutate(UPLOAD, { file });
  if (isSuccess(result)) {
    console.log('Uploaded:', result.data.uploadFile.url);
  }
}

// Trigger from a file input
document.querySelector('input[type=file]')
  ?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) uploadFile(file);
  });
`,
    angular: `import { provideDumbql, UploadService } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
    provideUploadService(),
  ],
};

@Component({ ... })
export class UploadComponent {
  private upload = inject(UploadService);

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.upload.upload(file).subscribe(result => {
        console.log('Uploaded:', result.data?.uploadFile.url);
      });
    }
  }
}
`,
    react: `import { DumbqlProvider, useMutation, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const UPLOAD = gql\`mutation Upload($file: Upload!) {
  uploadFile(file: $file) { url filename }
}\`;

function FileUpload() {
  const [upload, { data }] = useMutation(UPLOAD);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload({ variables: { file } });
  };

  return (
    <div>
      <input type="file" onChange={handleChange} />
      {data?.uploadFile && <p>URL: {data.uploadFile.url}</p>}
    </div>
  );
}

function App() {
  return <DumbqlProvider client={client}><FileUpload /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useMutation, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const { mutate, data } = useMutation(gql\`mutation Upload($file: Upload!) {
  uploadFile(file: $file) { url filename }
}\`);

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) mutate({ file });
}
</script>

<template>
  <input type="file" @change="onFileSelected" />
  <p v-if="data?.uploadFile">URL: {{ data.uploadFile.url }}</p>
</template>
`,
  };
}
