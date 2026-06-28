import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-doc-feature-card',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterLink],
	templateUrl: './doc-feature-card.html',
	styleUrl: './doc-feature-card.scss',
})
export class DocFeatureCard {
	readonly icon = input.required<string>();
	readonly title = input.required<string>();
	readonly description = input.required<string>();
	readonly link = input.required<string>();
}
