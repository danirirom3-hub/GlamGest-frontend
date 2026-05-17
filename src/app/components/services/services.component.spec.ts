/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesComponent } from './services.component';
import { ServicesService } from '../../services/services.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;
  let servicesServiceSpy: jasmine.SpyObj<ServicesService>;

  // Datos de prueba simulados
  const mockServicesList = [
    { id: 1, active: true, name: 'Corte de Cabello', price: 25000, description: 'Corte moderno', durationMinutes: 30 },
    { id: 2, active: false, name: 'Tintura Completa', price: 80000, description: 'Tintura sin amoniaco', durationMinutes: 120 }
  ];

  beforeEach(async () => {
    // Crear el espía para el servicio con todos sus métodos relacionales
    servicesServiceSpy = jasmine.createSpyObj('ServicesService', ['getServices', 'createService', 'updateService', 'deleteService']);
    
    // Simular que el backend retorna la lista inicial por defecto para el ngOnInit
    servicesServiceSpy.getServices.and.returnValue(of({ data: mockServicesList }));

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        { provide: ServicesService, useValue: servicesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
    
    // Espiar SweetAlert globalmente para evitar que se abran popups reales en pantalla
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
  });

  it('debería crear el componente e inicializar los servicios', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit
    expect(component).toBeTruthy();
    expect(servicesServiceSpy.getServices).toHaveBeenCalled();
    expect(component.services.length).toBe(2);
  });

  it('debería filtrar los servicios activos según el flag showOnlyActive', () => {
    fixture.detectChanges();
    
    component.showOnlyActive = true;
    expect(component.filteredServices.length).toBe(1); // Solo el id: 1 está activo

    component.toggleFiltro(); // Cambia a false
    expect(component.filteredServices.length).toBe(2); // Retorna todos
  });

  it('debería validar campos vacíos y no enviar el formulario si falta información', () => {
    component.service = { active: true, name: '', price: null, description: '', durationMinutes: null };
    
    component.saveService();

    expect(Swal.fire).toHaveBeenCalledWith('Campos incompletos', jasmine.any(String), 'warning');
    expect(servicesServiceSpy.createService).not.toHaveBeenCalled();
  });

  it('debería crear un nuevo servicio exitosamente', () => {
    fixture.detectChanges();
    component.isEditing = false;
    component.service = { active: true, name: 'Manicura', price: 15000, description: 'Uñas limpias', durationMinutes: 20 };

    servicesServiceSpy.createService.and.returnValue(of({ successful: true, data: { id: 3, name: 'Manicura', active: true } }));

    component.saveService();

    expect(servicesServiceSpy.createService).toHaveBeenCalled();
    expect(component.services.length).toBe(3); // Se agrega a la lista local
  });

  it('debería cargar los datos en el formulario al presionar editar', () => {
    const servicioSeleccionado = mockServicesList[0];
    
    component.editService(servicioSeleccionado);

    expect(component.isEditing).toBeTrue();
    expect(component.editServiceId).toBe(1);
    expect(component.service.name).toBe('Corte de Cabello');
  });

  it('debería limpiar el formulario al cancelar la edición', () => {
    component.isEditing = true;
    component.editServiceId = 44;

    component.cancelEdit();

    expect(component.isEditing).toBeFalse();
    expect(component.editServiceId).toBeNull();
    expect(component.service.name).toBe('');
  });

  it('debería manejar errores del backend al fallar la carga de datos', () => {
    servicesServiceSpy.getServices.and.returnValue(throwError(() => new Error('Error de conexión')));
    
    component.loadServices();

    expect(component.services.length).toBe(0);
    expect(Swal.fire).toHaveBeenCalled();
  });
});