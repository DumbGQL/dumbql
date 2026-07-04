import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
  RouteConfigLoadStart,
  RouteConfigLoadEnd,
} from '@angular/router';
import { TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink, TuiTextfield } from '@taiga-ui/core';
import { TuiDropdown, TuiDropdownDirective } from '@taiga-ui/core/portals/dropdown';
import { Logo } from './shared/ui/logo/logo';
import { VersionService } from './shared/services/version.service';
import { SidebarService } from './shared/services/sidebar.service';
import { TuiComboBox, TuiDataListWrapper } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TuiDropdownDirective],
  imports: [
    TuiLink,
    RouterOutlet,
    RouterLink,
    FormsModule,
    TuiDataListWrapper,
    RouterLinkActive,
    TuiButton,
    TuiRoot,
    Logo,
    TuiDropdown,
    TuiComboBox,
    ...TuiTextfield,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly darkMode = inject(TUI_DARK_MODE);
  private readonly router = inject(Router);
  protected readonly versionService = inject(VersionService);
  protected readonly sidebar = inject(SidebarService);

  protected readonly isDarkMode = this.darkMode;
  protected readonly showDocsMenu = signal(this.router.url.startsWith('/docs'));
  protected readonly loading = signal(true);

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
