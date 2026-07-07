import { Component, inject, signal } from '@angular/core';
import {
	Router,
	RouterLink,
	RouterLinkActive,
	RouterOutlet,
	NavigationEnd,
	RouteConfigLoadStart,
	RouteConfigLoadEnd,
} from '@angular/router';
import { TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink } from '@taiga-ui/core';
import { TuiDropdown } from '@taiga-ui/core/portals/dropdown';
import { TuiDataList } from '@taiga-ui/core/components/data-list';
import { TuiChevron } from '@taiga-ui/kit/directives/chevron';
import { TuiActiveZone } from '@taiga-ui/cdk/directives/active-zone';
import { TuiObscured } from '@taiga-ui/cdk/directives/obscured';
import { Logo } from './shared/ui/logo/logo';
import { VersionService } from './shared/services/version.service';
import { SidebarService } from './shared/services/sidebar.service';
import { TocService } from './shared/services/toc.service';
import { NullOverlay } from '@dumbql/core';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TuiLink,
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		TuiButton,
		TuiRoot,
		Logo,
		TuiDropdown,
		TuiDataList,
		TuiChevron,
		TuiActiveZone,
		TuiObscured,
		NullOverlay,
	],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	private readonly darkMode = inject(TUI_DARK_MODE);
	private readonly router = inject(Router);
	protected readonly versionService = inject(VersionService);
	protected readonly sidebar = inject(SidebarService);
	protected readonly tocService = inject(TocService);

	protected readonly isDarkMode = this.darkMode;
	protected readonly showDocsMenu = signal(this.router.url.startsWith('/docs'));
	protected readonly loading = signal(true);
	protected readonly open = signal(false);

	constructor() {
		let initialEnded = false;

		this.router.events.subscribe((event) => {
			if (event instanceof RouteConfigLoadStart) {
				this.loading.set(true);
			} else if (event instanceof RouteConfigLoadEnd) {
				this.loading.set(false);
			} else if (event instanceof NavigationEnd) {
				if (!initialEnded) {
					initialEnded = true;
					this.loading.set(false);
				}
				this.showDocsMenu.set(event.url.startsWith('/docs'));
			}
		});
	}

	protected toggleTheme(): void {
		this.darkMode.set(!this.darkMode());
	}
}
