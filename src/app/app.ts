import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, NavigationStart } from '@angular/router';
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
    let navCount = 0;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        navCount++;
        this.loading.set(true);
      } else if (event instanceof NavigationEnd) {
        navCount--;
        if (navCount <= 0) {
          navCount = 0;
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
