import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLanguage = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'glamgest-language';
  private readonly languageSubject = new BehaviorSubject<SupportedLanguage>(this.readLanguage());
  readonly language$ = this.languageSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en']);
    this.translate.setFallbackLang('es');
    this.translate.use(this.languageSubject.value);
    document.documentElement.lang = this.languageSubject.value;
  }

  get currentLanguage(): SupportedLanguage { return this.languageSubject.value; }

  setLanguage(language: SupportedLanguage): void {
    localStorage.setItem(this.storageKey, language);
    this.languageSubject.next(language);
    this.translate.use(language);
    document.documentElement.lang = language;
  }

  private readLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(this.storageKey);
    return stored === 'en' ? 'en' : 'es';
  }
}
