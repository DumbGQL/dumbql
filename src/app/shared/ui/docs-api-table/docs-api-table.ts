import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export interface ApiEntry {
	name: string;
	description: string;
	type: string;
	default?: string;
}

@Component({
	selector: 'app-docs-api-table',
	standalone: true,
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './docs-api-table.html',
	styleUrl: './docs-api-table.scss',
})
export class DocsApiTable {
	readonly entries = input.required<ApiEntry[]>();
}
