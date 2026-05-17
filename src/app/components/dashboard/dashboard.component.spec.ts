/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  // Spies para los servicios inyectados
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent], // Componente Standalone
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        // Proveedor mock de ActivatedRoute por si RouterModule lo solicita internamente
        { 
          provide: ActivatedRoute, 
          useValue: { params: of({}), snapshot: { paramMap: { get: () => null } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta el ciclo de vida inicial
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería tener cargados los iconos en el objeto de menú', () => {
    expect(component.icons.Scissors).toBeTruthy();
    expect(component.icons.Users).toBeTruthy();
    expect(component.icons.ShoppingCart).toBeTruthy();
    expect(component.icons.Calendar).toBeTruthy();
    expect(component.icons.User).toBeTruthy();
    expect(component.icons.Settings).toBeTruthy();
  });

  describe('logout', () => {
    it('debería cerrar sesión y redirigir al login tras 1 segundo si el usuario confirma', fakeAsync(() => {
      // Simulamos que el usuario hace clic en "Sí, salir" en Swal
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

      component.logout();
      tick(); // Resuelve la primera promesa del diálogo de confirmación

      // Verifica que se llame al método logout del servicio de autenticación
      expect(authServiceSpy.logout).toHaveBeenCalled();
      
      // Verifica que se muestre el segundo SweetAlert de éxito
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'success',
        title: 'Sesión cerrada'
      }));

      // Avanzamos el reloj virtual 1000ms para ejecutar el setTimeout interno
      tick(1000);

      // Verifica que finalmente se redirija a la ruta de login
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('no debería hacer nada si el usuario cancela la alerta de salida', fakeAsync(() => {
      // Simulamos que el usuario cancela o cierra la alerta
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

      component.logout();
      tick(); // Resuelve la promesa de Swal

      // Al cancelar, no debe llamar al servicio ni redirigir
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });
});