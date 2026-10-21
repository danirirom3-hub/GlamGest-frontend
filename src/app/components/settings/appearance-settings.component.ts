import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AppearancePreferencesService, AppearanceTheme } from '../../services/appearance-preferences.service';
import { SupportedLanguage } from '../../services/language.service';

@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.css']
})
export class AppearanceSettingsComponent {
  readonly themes: Array<{ id: AppearanceTheme; title: string; description: string }> = [
    { id: 'default', title: 'settings.neutral', description: 'settings.cleanStyle' },
    { id: 'dark', title: 'settings.dark', description: 'settings.nightMode' },
    { id: 'femenino', title: 'settings.soft', description: 'settings.softMode' }
  ];

  constructor(private appearancePreferences: AppearancePreferencesService) {}

  get currentTheme(): AppearanceTheme {
    return this.appearancePreferences.currentTheme;
  }

  get language(): SupportedLanguage {
    return this.appearancePreferences.currentLanguage;
  }

  setTheme(theme: AppearanceTheme): void {
    this.appearancePreferences.setTheme(theme);
  }

  setLanguage(language: SupportedLanguage): void {
    this.appearancePreferences.setLanguage(language);
  }
}
