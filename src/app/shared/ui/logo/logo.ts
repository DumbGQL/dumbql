import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-logo',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './logo.html',
	styleUrl: './logo.scss',
})
export class Logo {
  readonly size = input<'icon' | 'full'>('full');
}
