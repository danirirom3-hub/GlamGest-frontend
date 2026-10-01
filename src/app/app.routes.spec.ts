import { routes } from './app.routes';

describe('rutas administrativas', () => {
  it('expone reportes bajo admin con restricción ADMIN', () => {
    const admin = routes.find(route => route.path === 'admin');
    const reports = admin?.children?.find(route => route.path === 'reports');
    expect(reports).toBeTruthy();
    expect(reports?.canActivate?.length).toBe(1);
    expect(reports?.path).toBe('reports');
  });
});
