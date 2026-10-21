/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Creamos el espía para el servicio de autenticación con el método 'register'
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [UsersComponent], // Importación directa por ser Standalone
      providers: [
        provideTranslateService(),
        { provide: AuthService, useValue: authServiceSpy },
        { 
          provide: ActivatedRoute, 
          useValue: { params: of({}), snapshot: { paramMap: { get: () => null } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('registerUser', () => {
    it('debería mostrar un mensaje de error y detener la ejecución si falta algún campo obligatorio', () => {
      // Configuramos un usuario con campos vacíos
      component.user = { name: '', email: 'daniela@mail.com', password: '', privacyPolicyAccepted: false };

      component.registerUser();

      expect(component.message).toBe('users.missingFields');
      expect(component.messageType).toBe('error');
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('debería enviar el payload con la aceptación de política y limpiar el formulario', () => {
      // Seteamos los datos iniciales del formulario
      component.user = { name: 'Daniela Rincon', email: 'daniela@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: true };
      component.recaptchaToken = 'captcha-token';

      // Simulamos una respuesta positiva estructurada del backend
      const mockResponse = { successful: true };
      authServiceSpy.register.and.returnValue(of(mockResponse));

      component.registerUser();

      // Verificaciones del estado de carga y del envío correcto de datos
      expect(component.isLoading).toBeFalse();
      expect(authServiceSpy.register).toHaveBeenCalledWith({
        email: 'daniela@mail.com',
        name: 'Daniela Rincon',
        password: 'Password1!',
        phone: '3000000000',
        privacyPolicyAccepted: true,
        recaptchaToken: 'captcha-token'
      });

      // Verificaciones de las mutaciones de propiedades del componente
      expect(component.message).toBe('users.success');
      expect(component.messageType).toBe('success');
      expect(component.user.privacyPolicyAccepted).toBeFalse();
    });

    it('debería manejar el escenario donde el servidor responde exitosamente pero con flag successful en false', () => {
      component.user = { name: 'Angie Sosa', email: 'angie@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: true };
      component.recaptchaToken = 'captcha-token';

      const mockResponseFallida = { successful: false, message: 'El correo electrónico ya se encuentra registrado.' };
      authServiceSpy.register.and.returnValue(of(mockResponseFallida));

      component.registerUser();

      expect(component.isLoading).toBeFalse();
      expect(component.message).toBe('auth.emailExists');
      expect(component.messageType).toBe('error');
      // No debe limpiarse el formulario para que el usuario pueda corregir el dato
      expect(component.user.name).toBe('Angie Sosa');
    });

    it('no debe registrar si no se acepta la política', () => {
      component.user = { name: 'Test User', email: 'test@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: false };
      component.registerUser();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(component.message).toBe('users.privacyRequired');
    });

    it('no debe registrar si no se completa el captcha', () => {
      component.user = { name: 'Test User', email: 'test@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: true };

      component.registerUser();

      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(component.message).toBe('users.captchaRequired');
    });

    it('debería capturar el error de la petición HTTP fallida (catch del bloque de suscripción)', () => {
      component.user = { name: 'Test User', email: 'test@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: true };
      component.recaptchaToken = 'captcha-token';

      const mockHttpError = { error: { message: 'Error interno del servidor (500).' } };
      authServiceSpy.register.and.returnValue(throwError(() => mockHttpError));

      component.registerUser();

      expect(component.isLoading).toBeFalse();
      expect(component.message).toBe('users.genericError');
      expect(component.messageType).toBe('error');
    });

    it('debería mostrar un mensaje amigable para un captcha inválido en HTTP 400', () => {
      component.user = { name: 'Test User', email: 'test@mail.com', password: 'Password1!', phone: '3000000000', privacyPolicyAccepted: true };
      component.recaptchaToken = 'captcha-token';
      authServiceSpy.register.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Captcha inválido' }
      })));

      component.registerUser();

      expect(component.message).toBe('users.captchaInvalid');
      expect(component.recaptchaToken).toBeNull();
    });

    it('bloquea el registro mientras falte un requisito de la contraseña', () => {
      component.user = {
        name: 'Test User',
        email: 'test@mail.com',
        password: 'password1!',
        phone: '3000000000',
        privacyPolicyAccepted: true
      };
      component.recaptchaToken = 'captcha-token';

      component.registerUser();

      expect(component.message).toBe('errors.passwordUpper');
      expect(component.passwordPolicyErrorKey).toBe('errors.passwordUpper');
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });
  });
});
