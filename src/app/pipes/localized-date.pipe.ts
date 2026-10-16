import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({ name: 'localizedDate', standalone: true })
export class LocalizedDatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}

  transform(value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = this.languageService.currentLanguage === 'en' ? 'en-US' : 'es-CO';
    return new Intl.DateTimeFormat(locale, options || { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
}
