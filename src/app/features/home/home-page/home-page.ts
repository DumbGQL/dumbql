import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { WelcomeSection } from '../welcome-section/welcome-section';

@Component({
	selector: 'app-home-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterLink, TuiButton, WelcomeSection],
	templateUrl: './home-page.html',
	styleUrl: './home-page.scss',
})
export class HomePage {
	private readonly router = inject(Router);

	protected onStart(): void {
		void this.router.navigate(['/docs/getting-started']);
	}
}
