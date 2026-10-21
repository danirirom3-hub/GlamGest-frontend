import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { LanguageService, SupportedLanguage } from './language.service';

export type AppearanceTheme = 'default' | 'dark' | 'femenino';

@Injectable({ providedIn: 'root' })
export class AppearancePreferencesService {
  private scope: string | null = null;
  currentTheme: AppearanceTheme = 'default';

  constructor(
    private authService: AuthService,
    private languageService: LanguageService
  ) {
    this.authService.session$.subscribe(() => this.activateCurrentScope());
  }

  setTheme(theme: AppearanceTheme): void {
    this.currentTheme = theme;
    localStorage.setItem(this.themeStorageKey(), theme);
    this.applyTheme(theme);
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }

  get currentLanguage(): SupportedLanguage {
    return this.languageService.currentLanguage;
  }

  private activateCurrentScope(): void {
    const accountId = this.authService.getRole() === 'CLIENT'
      ? this.authService.getUserId() ?? this.authService.getClientId()
      : null;
    this.scope = accountId === null ? null : `client-${accountId}`;

    const storedTheme = localStorage.getItem(this.themeStorageKey());
    this.currentTheme = storedTheme === 'dark' || storedTheme === 'femenino'
      ? storedTheme
      : 'default';
    this.applyTheme(this.currentTheme);
    this.languageService.activateScope(this.scope);
  }

  private themeStorageKey(): string {
    return this.scope ? `theme:${this.scope}` : 'theme';
  }

  private applyTheme(theme: AppearanceTheme): void {
    document.body.classList.remove('dark', 'femenino');
    if (theme !== 'default') document.body.classList.add(theme);
  }
}
