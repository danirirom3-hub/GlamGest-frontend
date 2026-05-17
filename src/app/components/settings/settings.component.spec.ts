/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent] 
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    // Espiamos los métodos del localStorage nativo antes de cada prueba
    spyOn(localStorage, 'getItem').and.stub();
    spyOn(localStorage, 'setItem').and.stub();
  });

  afterEach(() => {
    // Limpiamos las clases del body del DOM real para que no afecte a otras pruebas
    document.body.classList.remove('dark', 'femenino');
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit (Inicialización del Tema)', () => {
    it('debería cargar el tema por defecto ("default") si no hay nada guardado en localStorage', () => {
      // Forzamos que getItem devuelva null (sin registros previos)
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      component.ngOnInit();

      expect(component.currentTheme).toBe('default');
      expect(document.body.classList.contains('dark')).toBeFalse();
      expect(document.body.classList.contains('femenino')).toBeFalse();
    });

    it('debería aplicar el tema guardado en localStorage si es diferente a "default"', () => {
      // Simulamos que el usuario ya tenía guardado el tema 'dark'
      (localStorage.getItem as jasmine.Spy).and.returnValue('dark');

      component.ngOnInit();

      expect(component.currentTheme).toBe('dark');
      expect(document.body.classList.contains('dark')).toBeTrue();
    });
  });

  describe('setTheme (Cambio de Tema)', () => {
    it('debería limpiar las clases anteriores, aplicar el nuevo tema, persistirlo y actualizar la variable', () => {
      // Estado inicial con una clase previa en el body
      document.body.classList.add('femenino');
      component.currentTheme = 'femenino';

      // Cambiamos al tema 'dark'
      component.setTheme('dark');

      // Validamos remoción e inserción en el DOM
      expect(document.body.classList.contains('femenino')).toBeFalse();
      expect(document.body.classList.contains('dark')).toBeTrue();

      // Validamos persistencia en localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

      // Validamos actualización de la propiedad reactiva
      expect(component.currentTheme).toBe('dark');
    });

    it('debería remover todas las clases si se selecciona el tema "default"', () => {
      document.body.classList.add('dark');
      
      component.setTheme('default');

      expect(document.body.classList.contains('dark')).toBeFalse();
      expect(document.body.classList.contains('femenino')).toBeFalse();
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'default');
      expect(component.currentTheme).toBe('default');
    });
  });

  describe('isActive', () => {
    it('debería retornar true si el tema consultado coincide con el tema actual', () => {
      component.currentTheme = 'dark';
      expect(component.isActive('dark')).toBeTrue();
    });

    it('debería retornar false si el tema consultado es diferente al tema actual', () => {
      component.currentTheme = 'default';
      expect(component.isActive('dark')).toBeFalse();
    });
  });
});