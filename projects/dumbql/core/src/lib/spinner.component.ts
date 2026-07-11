import { Component, input } from '@angular/core';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'accent' | 'warn' | 'inherit';

@Component({
	selector: 'dumbql-spinner',
	standalone: true,
	templateUrl: './spinner.component.html',
	styleUrl: './spinner.component.scss',
})
export class DumbqlSpinnerComponent {
	readonly size = input<SpinnerSize>('md');
	readonly color = input<SpinnerColor>('primary');
	readonly showLabel = input(false);
	readonly label = input('Loading...');
	readonly ariaLabel = input('Loading');
}
