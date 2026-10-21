import { AuditLogsComponent } from './audit-logs.component';
import { AuditLog } from '../../services/audit-logs.service';

describe('AuditLogsComponent localization', () => {
  const translations: Record<string, string> = {
    'auditLogs.modules.clients': 'Clients',
    'auditLogs.modules.other': 'Other module',
    'auditLogs.actionLabels.create': 'Creation',
    'auditLogs.actionLabels.other': 'Other action',
    'auditLogs.roles.admin': 'Administrator',
    'auditLogs.roles.other': 'Other role',
    'auditLogs.noRole': 'No role',
    'auditLogs.descriptions.create': 'A record was created in the {{module}} module.',
    'auditLogs.descriptions.createWithResource': 'A record was created in the {{module}} module: {{resourceName}}.',
    'auditLogs.descriptions.error': 'The operation in the {{module}} module could not be completed.'
  };

  const component = new AuditLogsComponent(
    {} as any,
    {
      instant: (key: string, params?: Record<string, string>) => {
        const value = translations[key] || key;
        return Object.entries(params || {}).reduce((text, [name, replacement]) => text.replace(`{{${name}}}`, replacement), value);
      }
    } as any,
    { localizeAuditError: (message: string) => `localized:${message}` } as any
  );

  const log = (overrides: Partial<AuditLog> = {}): AuditLog => ({
    id: 1,
    occurredAt: '2026-01-01T00:00:00',
    userId: 1,
    userEmail: 'admin@example.com',
    role: 'ROLE_ADMIN',
    action: 'CREATE',
    module: 'clients',
    resourceId: '1',
    httpMethod: 'POST',
    endpoint: '/api/clients',
    statusCode: 201,
    description: 'Se creó un registro en el módulo de clientes.',
    ipAddress: null,
    userAgent: null,
    errorMessage: null,
    ...overrides
  });

  it('renders historical descriptions from language-neutral audit fields', () => {
    const row = log();

    expect(component.actionLabel(row.action)).toBe('Creation');
    expect(component.moduleLabel(row.module)).toBe('Clients');
    expect(component.roleLabel(row.role)).toBe('Administrator');
    expect(component.descriptionFor(row)).toBe('A record was created in the Clients module.');
  });

  it('uses the localized error description regardless of the stored Spanish sentence', () => {
    const row = log({ action: 'ERROR', statusCode: 500, description: 'No se pudo completar la operación.' });

    expect(component.descriptionFor(row)).toBe('The operation in the Clients module could not be completed.');
  });

  it('includes the affected resource name in localized new audit entries', () => {
    const row = log({ resourceName: 'Relaxing massage' });

    expect(component.descriptionFor(row)).toBe('A record was created in the Clients module: Relaxing massage.');
  });

  it('does not show unknown action or module values untranslated', () => {
    expect(component.actionLabel('FUTURE_ACTION')).toBe('Other action');
    expect(component.moduleLabel('future-module')).toBe('Other module');
  });
});
