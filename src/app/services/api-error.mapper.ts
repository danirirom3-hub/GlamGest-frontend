import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

interface MessagePattern {
  match: RegExp;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  private readonly patterns: MessagePattern[] = [
    { match: /captcha.*(invalid|expired)|captcha.*no es válido|captcha.*expirado|recaptcha inválido/i, key: 'auth.invalidCaptcha' },
    { match: /recaptcha|captcha/i, key: 'errors.recaptchaRequired' },
    { match: /correo ya está registrado para otro cliente|email.*already registered for another client/i, key: 'clients.duplicateEmail' },
    { match: /teléfono ya está registrado para otro cliente|phone.*already registered for another client/i, key: 'clients.duplicatePhone' },
    { match: /teléfono.*registrado.*empleado|employee.*phone.*already|phone.*already registered.*employee/i, key: 'employees.duplicatePhone' },
    { match: /correo electrónico ya se encuentra registrado/i, key: 'auth.emailExists' },
    { match: /email already exists|email ya tiene una cuenta|el cliente ya tiene una cuenta/i, key: 'auth.emailExists' },
    { match: /ya existe un servicio activo con ese nombre|ya existe un servicio con ese nombre|service.*already exists/i, key: 'services.duplicateName' },
    { match: /categor(y|ía).*name.*already exists|category name already exists/i, key: 'services.duplicateName' },
    { match: /nombre ya está en uso|name is already in use/i, key: 'services.duplicateName' },
    { match: /el correo ya está registrado|email.*already registered|email pertenece a un usuario interno/i, key: 'clients.duplicateEmail' },
    { match: /teléfono ya pertenece|teléfono no coincide|phone.*already exists/i, key: 'clients.duplicatePhone' },
    { match: /empleado ya tiene una cita|employee already has an appointment/i, key: 'appointments.scheduleConflict' },
    { match: /cita no encontrada|appointment.*not found/i, key: 'appointments.notFound' },
    { match: /servicio no encontrado|service.*not found/i, key: 'services.notFound' },
    { match: /cliente no encontrado|client.*not found/i, key: 'clients.notFound' },
    { match: /empleado no encontrado|employee.*not found/i, key: 'employees.notFound' },
    { match: /usuario.*no encontrado|user.*not found/i, key: 'errors.userNotFound' },
    { match: /categoría no encontrada|category.*not found/i, key: 'services.categoryNotFound' },
    { match: /venta no encontrada|sale.*not found/i, key: 'sales.notFound' },
    { match: /fecha de la cita debe ser futura|appointment date must be in the future/i, key: 'appointments.mustBeFuture' },
    { match: /cita cancelada o no asistida|appointment.*cancelled or.*no.?show/i, key: 'sales.appointmentUnavailable' },
    { match: /sale must contain at least one|sale details.*required/i, key: 'sales.servicesRequiredText' },
    { match: /sale detail must include a service|detalle de venta.*servicio/i, key: 'sales.serviceRequiredText' },
    { match: /sale detail must include an employee|detalle de venta.*empleado/i, key: 'sales.employeeRequiredText' },
    { match: /appointment does not contain a linked service|cita no tiene.*servicio/i, key: 'sales.serviceRequiredText' },
    { match: /appointment does not contain a linked employee|cita no tiene.*empleado/i, key: 'sales.employeeRequiredText' },
    { match: /venta anulada no se puede modificar|cancelled sale cannot be modified/i, key: 'sales.cancelledCannotUpdate' },
    { match: /la venta ya está anulada|sale is already cancelled/i, key: 'sales.alreadyCancelled' },
    { match: /las citas no se eliminan|appointments cannot be deleted/i, key: 'appointments.cannotDelete' },
    { match: /detalles de una venta no se pueden eliminar|sale detail.*cannot be deleted/i, key: 'sales.detailCannotDelete' },
    { match: /no puede modificar esta cita|cannot modify this appointment/i, key: 'appointments.cannotEdit' },
    { match: /backup.*does not exist|backup no existe/i, key: 'settings.backupNotFound' },
    { match: /checksum.*does not match|checksum.*no coincide/i, key: 'settings.backupChecksumMismatch' },
    { match: /estado de cita no válido|invalid appointment status/i, key: 'errors.appointmentStatusRequired' },
    { match: /duración.*múltiplo de 15|duration.*multiple of 15/i, key: 'services.invalidDuration' },
    { match: /fecha final no puede ser anterior|end date cannot be earlier/i, key: 'reports.invalidRange' },
    { match: /credenciales.*(inválidas|incorrectas)|invalid credentials|account inactive/i, key: 'auth.invalidCredentials' },
    { match: /error de conexión con el servidor|connection error with the server/i, key: 'errors.connection' },
    { match: /no tiene permisos para realizar esta operación|do not have permission/i, key: 'errors.forbidden' },
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
      return validation.map(message => {
        const pattern = this.patterns.find(item => item.match.test(message));
        return this.translate.instant(pattern?.key || 'errors.generic');
      }).join(' ');
    }

    const raw = this.extractMessage(error);
    if (raw) {
      const pattern = this.patterns.find(item => item.match.test(raw));
      return pattern ? this.translate.instant(pattern.key) : fallbackText;
    }
    return fallbackText;
  }

  /** Traduce un mensaje crudo del backend (por ejemplo una respuesta successful=false). */
  localize(raw: string | undefined | null, fallbackKey = 'errors.generic'): string {
    if (!raw) return this.translate.instant(fallbackKey);
    const pattern = this.patterns.find(item => item.match.test(raw));
    return this.translate.instant(pattern?.key || fallbackKey);
  }

  /** Localizes a stored audit error without leaking an unknown message in the wrong language. */
  localizeAuditError(raw: string | undefined | null): string {
    return this.localize(raw, 'auditLogs.errorDetailsUnavailable');
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
