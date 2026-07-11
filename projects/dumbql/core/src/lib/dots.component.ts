import { Component, input } from '@angular/core';

export type DotsSize = 'sm' | 'md' | 'lg';
export type DotsColor = 'primary' | 'accent' | 'warn' | 'inherit';

@Component({
	selector: 'dumbql-dots',
	standalone: true,
	templateUrl: './dots.component.html',
	styleUrl: './dots.component.scss',
})
export class DumbqlDotsComponent {
	readonly size = input<DotsSize>('md');
	readonly color = input<DotsColor>('primary');
	readonly showLabel = input(false);
	readonly label = input('Loading');
	readonly ariaLabel = input('Loading');
}
