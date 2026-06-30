import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink } from '@taiga-ui/core';
import { TuiDropdown, TuiDropdownDirective } from '@taiga-ui/core/portals/dropdown';
import { Logo } from './shared/ui/logo/logo';
import { VersionService } from './shared/services/version.service';
import { TuiChevron, TuiComboBox, TuiDataListWrapper } from '@taiga-ui/kit';
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

    TuiChevron,
    TuiComboBox,
    TuiDropdown,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly darkMode = inject(TUI_DARK_MODE);
  protected readonly versionService = inject(VersionService);

  protected readonly isDarkMode = this.darkMode;

  protected toggleTheme(): void {
    this.darkMode.set(!this.darkMode());
  }
}
