import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-docs-devcontainers',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './devcontainers.html',
	styleUrl: './devcontainers.scss',
})
export class DocsDevcontainers {}
