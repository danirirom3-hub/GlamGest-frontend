import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('limpia toda la información de autenticación al cerrar sesión', () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('userId', '10');
    localStorage.setItem('user_id', '10');
    localStorage.setItem('id', '10');
    localStorage.setItem('role', 'ADMIN');
    localStorage.setItem('clientId', '20');
    localStorage.setItem('privacyPolicyPending', 'true');
    localStorage.setItem('privacyPolicyVersion', '1');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('id')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('clientId')).toBeNull();
    expect(localStorage.getItem('privacyPolicyPending')).toBeNull();
    expect(localStorage.getItem('privacyPolicyVersion')).toBeNull();
  });

  it('envía la contraseña al endpoint de desbloqueo', () => {
    service.unlock('mi-clave').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/auth/unlock`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ password: 'mi-clave' });
    request.flush({ successful: true });
  });
});
