import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { StackblitzStarterService } from '../../../../shared/stackblitz/stackblitz-starter.service';

@Component({
	selector: 'app-docs-devcontainers',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './devcontainers.html',
	styleUrl: './devcontainers.scss',
})
export class DocsDevcontainers {
	protected readonly sandbox = inject(StackblitzStarterService);
}
