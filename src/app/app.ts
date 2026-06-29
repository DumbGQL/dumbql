import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiTextfield, TuiButton, TuiRoot, TUI_DARK_MODE, TuiLink } from '@taiga-ui/core';
import { TuiSelect } from '@taiga-ui/kit';
import { Logo } from './shared/ui/logo/logo';
import { VersionService } from './shared/services/version.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...TuiTextfield,
    TuiLink,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TuiButton,
    TuiRoot,
    Logo,
    TuiSelect,
    FormsModule,
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
