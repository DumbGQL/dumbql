import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink } from '@taiga-ui/core';
import { TuiDataList } from '@taiga-ui/core/components/data-list';
import { TuiDropdown } from '@taiga-ui/core/portals/dropdown';
import { Logo } from './shared/ui/logo/logo';
import { VersionService } from './shared/services/version.service';
import { TuiComboBox, TuiDataListWrapper } from '@taiga-ui/kit';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiLink,
    RouterOutlet,
    RouterLink,
    ...TuiDataListWrapper,
    RouterLinkActive,
    TuiButton,
    TuiRoot,
    Logo,
    ...TuiComboBox,
    ...TuiDropdown,
    ...TuiDataList,
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
