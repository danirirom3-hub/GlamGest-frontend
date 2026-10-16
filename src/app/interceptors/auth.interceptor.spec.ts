import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken', 'logout', 'markPrivacyPolicyPending'
    ]);
    authServiceSpy.getToken.and.returnValue('token');
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    (routerSpy as any).url = '/';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('redirige a la aceptación ante un 403 de política pendiente y conserva el token', () => {
    http.get('/api/protected').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/protected');

    request.flush({ code: 'PRIVACY_POLICY_REQUIRED', privacyPolicyVersion: '2' }, {
      status: 403,
      statusText: 'Forbidden'
    });

    expect(authServiceSpy.markPrivacyPolicyPending).toHaveBeenCalledWith('2');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/privacy-policy']);
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });
});
