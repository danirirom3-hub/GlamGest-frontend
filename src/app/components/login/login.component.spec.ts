/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  // Spies de dependencias
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'saveToken', 'saveSession', 'getUserId', 'isPrivacyPolicyPending'
    ]);
    authServiceSpy.isPrivacyPolicyPending.and.returnValue(false);
    authServiceSpy.saveSession.and.callFake((response: any) => {
      const token = response?.data?.token || response?.token;
      if (token) authServiceSpy.saveToken(token);
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent], // Componente Standalone
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { 
          provide: ActivatedRoute, 
          useValue: { params: of({}), snapshot: { paramMap: { get: () => null } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Espiamos el localStorage nativo del navegador para verificar las inserciones
    spyOn(localStorage, 'setItem');
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('onLogin', () => {
    it('debería mostrar error si los campos están incompletos', () => {
      component.user = { email: '', password: '' };
      component.onLogin();

      expect(component.message).toBe('Debes ingresar correo y contraseña.');
      expect(component.messageType).toBe('error');
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('no debería enviar el formulario si el captcha no está completado', () => {
      component.user = { email: 'daniela@mail.com', password: 'password123' };

      component.onLogin();

      expect(component.message).toBe('Completa el captcha antes de iniciar sesión.');
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('debería procesar login exitoso, guardar token/userId en localStorage y redirigir tras 1.5s', fakeAsync(() => {
      component.user = { email: 'daniela@mail.com', password: 'password123' };
      component.recaptchaToken = 'captcha-token';

      // Simulamos la respuesta estructurada del backend con token e id de usuario
      const mockResponse = {
        data: {
          token: 'jwt-token-valido',
          user: { id: 45 },
          role: 'ADMIN'
        }
      };
      authServiceSpy.login.and.returnValue(of(mockResponse));

      component.onLogin();

      // Validaciones inmediatas
      expect(authServiceSpy.login).toHaveBeenCalledWith({
        email: 'daniela@mail.com',
        password: 'password123',
        recaptchaToken: 'captcha-token',
        website: ''
      });
      expect(authServiceSpy.saveToken).toHaveBeenCalledWith('jwt-token-valido');
      
      // Verifica que guarde el id en las variantes de localStorage requeridas
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', '45');
      expect(localStorage.setItem).toHaveBeenCalledWith('user_id', '45');
      expect(localStorage.setItem).toHaveBeenCalledWith('id', '45');

      expect(component.message).toBe('Login exitoso. Redirigiendo...');
      expect(component.messageType).toBe('success');

      // Avanzamos los 1500ms del setTimeout
      tick(1500);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('debería recurrir a authService.getUserId() si el backend no devuelve el id directamente', fakeAsync(() => {
      component.user = { email: 'angie@mail.com', password: 'password123' };
      component.recaptchaToken = 'captcha-token';

      const mockResponseSinId = { token: 'jwt-token-valido' }; // Sin id de usuario en la respuesta
      authServiceSpy.login.and.returnValue(of(mockResponseSinId));
      authServiceSpy.getUserId.and.returnValue(99); // El servicio provee el id de respaldo

      component.onLogin();

      expect(authServiceSpy.getUserId).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', '99');
      
      tick(1500); // Limpia el temporizador latente
    }));

    it('debería mostrar mensaje de error si el backend responde sin un token válido', () => {
      component.user = { email: 'test@mail.com', password: 'wrongpassword' };
      component.recaptchaToken = 'captcha-token';
      const mockResponseErr = { message: 'Credenciales inválidas o cuenta inactiva.' };
      
      authServiceSpy.login.and.returnValue(of(mockResponseErr));

      component.onLogin();

      expect(component.message).toBe('Credenciales inválidas o cuenta inactiva.');
      expect(component.messageType).toBe('error');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('debería guardar el token y enviar a la aceptación si la política está pendiente', () => {
      component.user = { email: 'pending@mail.com', password: 'password123' };
      component.recaptchaToken = 'captcha-token';
      authServiceSpy.isPrivacyPolicyPending.and.returnValue(true);
      authServiceSpy.login.and.returnValue(of({
        data: {
          token: 'jwt-pendiente',
          role: 'ADMIN',
          privacyPolicyAccepted: false,
          privacyPolicyRequired: true,
          privacyPolicyVersion: '2'
        }
      }));

      component.onLogin();

      expect(authServiceSpy.saveToken).toHaveBeenCalledWith('jwt-pendiente');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/privacy-policy']);
    });

    it('debería manejar el error de la petición HTTP fallida', () => {
      component.user = { email: 'error@mail.com', password: 'any' };
      component.recaptchaToken = 'captcha-token';
      const errorHttp = { error: { message: 'Error de conexión con el servidor.' } };
      
      authServiceSpy.login.and.returnValue(throwError(() => errorHttp));

      component.onLogin();

      expect(component.message).toBe('Error de conexión con el servidor.');
      expect(component.messageType).toBe('error');
    });

    it('debería mostrar un mensaje amigable para un captcha inválido en HTTP 400', () => {
      component.user = { email: 'error@mail.com', password: 'any' };
      component.recaptchaToken = 'captcha-token';
      authServiceSpy.login.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'reCAPTCHA inválido' }
      })));

      component.onLogin();

      expect(component.message).toBe('El captcha no es válido o ha expirado. Complétalo nuevamente.');
      expect(component.recaptchaToken).toBeNull();
    });
  });
});
