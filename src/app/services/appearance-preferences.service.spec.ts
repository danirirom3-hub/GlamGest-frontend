import { BehaviorSubject } from 'rxjs';
import { AppearancePreferencesService } from './appearance-preferences.service';
import { LanguageService } from './language.service';

describe('AppearancePreferencesService', () => {
  const preferenceKeys = [
    'theme',
    'glamgest-language',
    'theme:client-11',
    'glamgest-language:client-11',
    'theme:client-22',
    'glamgest-language:client-22'
  ];

  beforeEach(() => {
    preferenceKeys.forEach(key => localStorage.removeItem(key));
    document.body.classList.remove('dark', 'femenino');
  });

  afterEach(() => {
    preferenceKeys.forEach(key => localStorage.removeItem(key));
    document.body.classList.remove('dark', 'femenino');
  });

  it('keeps client preferences separate from each other and from admin preferences', () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('glamgest-language', 'en');
    localStorage.setItem('theme:client-11', 'femenino');
    localStorage.setItem('glamgest-language:client-11', 'es');
    localStorage.setItem('theme:client-22', 'default');
    localStorage.setItem('glamgest-language:client-22', 'en');

    let role: string | null = 'ADMIN';
    let userId: number | null = null;
    const sessionSubject = new BehaviorSubject(true);
    const auth = {
      session$: sessionSubject.asObservable(),
      getRole: () => role,
      getUserId: () => userId,
      getClientId: () => null
    };
    const translate = {
      addLangs: jasmine.createSpy('addLangs'),
      setFallbackLang: jasmine.createSpy('setFallbackLang'),
      use: jasmine.createSpy('use')
    };
    const languageService = new LanguageService(translate as any);
    const preferences = new AppearancePreferencesService(auth as any, languageService);

    expect(preferences.currentTheme).toBe('dark');
    expect(languageService.currentLanguage).toBe('en');

    role = 'CLIENT';
    userId = 11;
    sessionSubject.next(true);
    expect(preferences.currentTheme).toBe('femenino');
    expect(languageService.currentLanguage).toBe('es');

    preferences.setTheme('dark');
    preferences.setLanguage('en');
    expect(localStorage.getItem('theme:client-11')).toBe('dark');
    expect(localStorage.getItem('glamgest-language:client-11')).toBe('en');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('glamgest-language')).toBe('en');

    userId = 22;
    sessionSubject.next(true);
    expect(preferences.currentTheme).toBe('default');
    expect(languageService.currentLanguage).toBe('en');
    expect(localStorage.getItem('theme:client-22')).toBe('default');

    role = 'ADMIN';
    userId = null;
    sessionSubject.next(true);
    expect(preferences.currentTheme).toBe('dark');
    expect(languageService.currentLanguage).toBe('en');
  });
});
