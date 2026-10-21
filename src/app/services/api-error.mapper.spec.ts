import { ApiErrorMapper } from './api-error.mapper';

describe('ApiErrorMapper', () => {
  const createMapper = () => {
    const translate = {
      instant: (key: string) => `translated:${key}`
    };
    return new ApiErrorMapper(translate as any);
  };

  it('localizes stored historical errors in either language', () => {
    const mapper = createMapper();

    expect(mapper.localizeAuditError('El correo ya está registrado para otro cliente.'))
      .toBe('translated:clients.duplicateEmail');
    expect(mapper.localizeAuditError('Email already exists: user@example.com'))
      .toBe('translated:auth.emailExists');
  });

  it('uses a localized fallback for unknown historical error details', () => {
    const mapper = createMapper();

    expect(mapper.localizeAuditError('Unexpected database driver exception'))
      .toBe('translated:auditLogs.errorDetailsUnavailable');
  });

  it('does not expose an unknown API error in its source language', () => {
    const mapper = createMapper();

    expect(mapper.resolve({ status: 500, error: { message: 'Mensaje interno sin traducción' } }, 'translated:fallback'))
      .toBe('translated:fallback');
  });
});
