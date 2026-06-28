import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink } from '@taiga-ui/core';
import { Logo } from './shared/ui/logo/logo';

@Component({
	selector: 'app-root',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TuiLink, RouterOutlet, RouterLink, RouterLinkActive, TuiButton, TuiRoot, Logo],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	private readonly darkMode = inject(TUI_DARK_MODE);

	protected readonly isDarkMode = this.darkMode;

	protected toggleTheme(): void {
		this.darkMode.set(!this.darkMode());
	}
}
