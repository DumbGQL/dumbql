import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CodeSandboxStarterService } from '../../../../shared/codesandbox/codesandbox-starter.service';

@Component({
  selector: 'app-docs-devcontainers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devcontainers.html',
  styleUrl: './devcontainers.scss',
})
export class DocsDevcontainers {
  protected readonly sandbox = inject(CodeSandboxStarterService);
}
