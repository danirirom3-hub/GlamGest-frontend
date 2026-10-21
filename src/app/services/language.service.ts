import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLanguage = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private activeStorageKey = 'glamgest-language';
  private readonly languageSubject = new BehaviorSubject<SupportedLanguage>(this.readLanguage());
  readonly language$ = this.languageSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en']);
    this.translate.setFallbackLang('es');
    this.applyLanguage(this.languageSubject.value);
  }

  get currentLanguage(): SupportedLanguage { return this.languageSubject.value; }

  activateScope(scope: string | null): void {
    this.activeStorageKey = scope ? `glamgest-language:${scope}` : 'glamgest-language';
    this.languageSubject.next(this.readLanguage());
    this.applyLanguage(this.languageSubject.value);
  }

  setLanguage(language: SupportedLanguage): void {
    localStorage.setItem(this.activeStorageKey, language);
    this.languageSubject.next(language);
    this.applyLanguage(language);
  }

  private readLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(this.activeStorageKey);
    return stored === 'en' ? 'en' : 'es';
  }

  private applyLanguage(language: SupportedLanguage): void {
    this.translate.use(language);
    document.documentElement.lang = language;
  }
}
