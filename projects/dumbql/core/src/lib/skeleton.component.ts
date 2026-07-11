import { Component, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'table' | 'list' | 'paragraph';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

@Component({
	selector: 'dumbql-skeleton',
	standalone: true,
	templateUrl: './skeleton.component.html',
	styleUrl: './skeleton.component.scss',
})
export class DumbqlSkeletonComponent {
	readonly variant = input<SkeletonVariant>('text');
	readonly animation = input<SkeletonAnimation>('pulse');
	readonly width = input<string>();
	readonly height = input<string>();
	readonly textWidth = input<string>('100%');
	readonly tableRows = input(5);
	readonly listItems = input(4);
	readonly paragraphLines = input(4);
	readonly ariaLabel = input('Loading content');
}
