import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isPrivacyPolicyPending', 'acceptPrivacyPolicy', 'getPrivacyPolicy', 'getRole', 'logout'
    ]);
    authServiceSpy.isPrivacyPolicyPending.and.returnValue(true);
    authServiceSpy.getPrivacyPolicy.and.returnValue(of({
      data: { version: '1.0', effectiveDate: '2026-09-24', content: '# Política' },
      status: 200,
      successful: true,
      message: 'Política de tratamiento de datos'
    }));
    authServiceSpy.getRole.and.returnValue('ADMIN');
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mantiene bloqueado el avance si no se marca la aceptación', () => {
    component.confirm();
    expect(authServiceSpy.acceptPrivacyPolicy).not.toHaveBeenCalled();
    expect(component.message).toBe('Debes aceptar la política para continuar.');
  });

  it('acepta la política y permite entrar a la aplicación', () => {
    authServiceSpy.acceptPrivacyPolicy.and.returnValue(of({ successful: true }));
    component.accepted = true;

    component.confirm();

    expect(authServiceSpy.acceptPrivacyPolicy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('muestra error y mantiene el bloqueo si falla la aceptación', () => {
    authServiceSpy.acceptPrivacyPolicy.and.returnValue(throwError(() => ({ status: 500 })));
    component.accepted = true;

    component.confirm();

    expect(component.message).toBe('No se pudo aceptar la política. Inténtalo nuevamente.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
