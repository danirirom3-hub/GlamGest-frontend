import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

interface MessagePattern {
  match: RegExp;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  private readonly patterns: MessagePattern[] = [
    { match: /recaptcha|captcha/i, key: 'errors.recaptchaRequired' },
    { match: /contraseña.*obligatoria|password.*required/i, key: 'errors.passwordRequired' },
    { match: /contraseña.*al menos 8|at least 8 characters/i, key: 'errors.passwordMin' },
    { match: /mayúscula|uppercase/i, key: 'errors.passwordUpper' },
    { match: /minúscula|lowercase/i, key: 'errors.passwordLower' },
    { match: /al menos un número|at least one number/i, key: 'errors.passwordNumber' },
    { match: /carácter especial|special character/i, key: 'errors.passwordSpecial' },
    { match: /no debe contener espacios|must not contain spaces/i, key: 'errors.passwordSpaces' },
    { match: /política de tratamiento|data processing policy|privacy/i, key: 'errors.registerPrivacyRequired' },
    { match: /fecha de la cita|appointment date/i, key: 'errors.appointmentDateRequired' },
    { match: /id del cliente|client id/i, key: 'errors.appointmentClientIdRequired' },
    { match: /id del empleado|employee id/i, key: 'errors.appointmentEmployeeIdRequired' },
    { match: /id del servicio|service id/i, key: 'errors.appointmentServiceIdRequired' },
    { match: /estado de la cita|appointment status/i, key: 'errors.appointmentStatusRequired' },
    { match: /nombre.*obligatorio|name is required/i, key: 'errors.clientNameRequired' },
    { match: /correo.*obligatorio|email is required/i, key: 'errors.clientEmailRequired' },
    { match: /correo.*formato|email.*valid|email.*valid/i, key: 'errors.clientEmailInvalid' },
    { match: /teléfono.*obligatorio|phone.*required/i, key: 'errors.clientPhoneRequired' },
    { match: /teléfono.*números|phone.*valid|phone number/i, key: 'errors.clientPhoneInvalid' },
    { match: /correo ya está registrado|email.*already/i, key: 'clients.duplicateEmail' },
    { match: /teléfono ya está registrado|phone.*already/i, key: 'clients.duplicatePhone' },
    { match: /cantidad debe ser mayor|quantity.*greater/i, key: 'errors.quantityPositive' },
    { match: /id de la venta|sale id/i, key: 'errors.saleIdRequired' },
    { match: /lista de detalles|sale details/i, key: 'errors.saleDetailsRequired' },
    { match: /id del usuario|user id/i, key: 'errors.userIdRequired' },
    { match: /precio.*obligatorio|price.*required/i, key: 'errors.priceRequired' },
    { match: /precio.*mayor o igual|price.*greater than or equal/i, key: 'errors.priceNonNegative' },
    { match: /duración.*obligatoria|duration.*required/i, key: 'errors.durationRequired' },
    { match: /nombre del servicio|service name/i, key: 'errors.serviceNameRequired' },
    { match: /nombre de la categoría|category name/i, key: 'errors.categoryNameRequired' },
    { match: /nombre del empleado|employee name/i, key: 'errors.employeeNameRequired' },
    { match: /teléfono del empleado|employee phone/i, key: 'errors.employeePhoneRequired' },
    { match: /nombre de usuario|user name/i, key: 'errors.userNameRequired' },
    { match: /correo del usuario|user email/i, key: 'errors.userEmailRequired' }
  ];

  constructor(private translate: TranslateService) {}

  /** Traduce un error HTTP/validación del backend a un texto localizado. */
  resolve(error: any, fallbackText = this.translate.instant('errors.generic')): string {
    if (error?.status === 0) return this.translate.instant('errors.connection');
    if (error?.status === 401) return this.translate.instant('errors.sessionExpired');
    if (error?.status === 403) return this.translate.instant('errors.forbidden');
    if (error?.status === 404) return this.translate.instant('errors.notFound');

    const validation = this.validationMessages(error);
    if (validation.length) {
      return validation.map(message => this.localize(message)).join(' ');
    }

    const raw = this.extractMessage(error);
    if (raw) return this.localize(raw);
    return fallbackText;
  }

  /** Traduce un mensaje crudo del backend (por ejemplo una respuesta successful=false). */
  localize(raw: string | undefined | null, fallbackKey = 'errors.generic'): string {
    if (!raw) return this.translate.instant(fallbackKey);
    const pattern = this.patterns.find(item => item.match.test(raw));
    return pattern ? this.translate.instant(pattern.key) : raw;
  }

  private validationMessages(error: any): string[] {
    const data = error?.error?.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.values(data).filter((value): value is string => typeof value === 'string');
    }
    const body = error?.error;
    if (body && typeof body === 'object' && !Array.isArray(body) && !body.message && !body.error) {
      return Object.values(body).filter((value): value is string => typeof value === 'string');
    }
    return [];
  }

  private extractMessage(error: any): string | undefined {
    if (typeof error?.error === 'string') return error.error;
    return error?.error?.error || error?.error?.message || error?.message;
  }
}
