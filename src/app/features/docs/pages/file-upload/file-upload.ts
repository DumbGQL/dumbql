import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip } from '@taiga-ui/kit';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-file-upload',
  standalone: true,
  imports: [TuiBadge, TuiChip, AnchorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class DocsFileUpload {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/file-upload');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/file-upload/src/lib';

  constructor() {
    this.tocService.sections.set([
      { id: 'upload-service', title: 'UploadService' },
      { id: 'multipart-spec', title: 'Multipart Spec' },
      { id: 'auto-detection', title: 'Auto Detection' },
    ]);
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
}
