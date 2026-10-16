/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesComponent } from './services.component';
import { ServicesService } from '../../services/services.service';
import { CategoriesService } from '../../services/categories.service';
import { AuthService } from '../../services/auth.service';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;
  let servicesServiceSpy: jasmine.SpyObj<ServicesService>;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockServicesList = [
    { id: 1, active: true, name: 'Corte de Cabello', price: 25000, description: 'Corte moderno', durationMinutes: 30, categoryId: null },
    { id: 2, active: false, name: 'Tintura Completa', price: 80000, description: 'Tintura sin amoniaco', durationMinutes: 120, categoryId: null }
  ];

  beforeEach(async () => {
    servicesServiceSpy = jasmine.createSpyObj('ServicesService', ['getAdminServices', 'createService', 'updateService', 'deleteService']);
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['getAdminCategories', 'createCategory', 'updateCategory', 'deleteCategory']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);

    servicesServiceSpy.getAdminServices.and.returnValue(of({ data: mockServicesList.map(s => ({ ...s })) }) as any);
    categoriesServiceSpy.getAdminCategories.and.returnValue(of({ data: [] }) as any);
    authServiceSpy.getRole.and.returnValue('ADMIN');

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        provideTranslateService(),
        { provide: ServicesService, useValue: servicesServiceSpy },
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
  });

  it('debería crear el componente e inicializar los servicios', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(servicesServiceSpy.getAdminServices).toHaveBeenCalled();
    expect(component.services.length).toBe(2);
  });

  it('debería filtrar los servicios según el estado seleccionado', () => {
    fixture.detectChanges();

    component.statusFilter = 'active';
    expect(component.filteredServices.length).toBe(1);

    component.statusFilter = 'all';
    expect(component.filteredServices.length).toBe(2);

    component.statusFilter = 'inactive';
    expect(component.filteredServices.length).toBe(1);
  });

  it('debería validar campos vacíos y no enviar el formulario si falta información', () => {
    fixture.detectChanges();
    component.service = { active: true, name: '', price: null, description: '', durationMinutes: null, categoryId: null };

    component.saveService();

    expect(Swal.fire).toHaveBeenCalledWith('common.error', 'services.incomplete', 'warning');
    expect(servicesServiceSpy.createService).not.toHaveBeenCalled();
  });

  it('debería crear un nuevo servicio exitosamente', () => {
    fixture.detectChanges();
    component.isEditing = false;
    component.service = { active: true, name: 'Manicura', price: 15000, description: 'Uñas limpias', durationMinutes: 30, categoryId: null };

    servicesServiceSpy.createService.and.returnValue(of({ successful: true, data: { id: 3, name: 'Manicura', active: true } } as any));

    component.saveService();

    expect(servicesServiceSpy.createService).toHaveBeenCalled();
    expect(component.services.length).toBe(3);
  });

  it('debería cargar los datos en el formulario al presionar editar', () => {
    fixture.detectChanges();
    const servicioSeleccionado = mockServicesList[0];

    component.openEditService(servicioSeleccionado);

    expect(component.isEditing).toBeTrue();
    expect(component.editServiceId).toBe(1);
    expect(component.service.name).toBe('Corte de Cabello');
    expect(component.serviceModalOpen).toBeTrue();
  });

  it('debería manejar errores del backend al fallar la carga de datos', () => {
    servicesServiceSpy.getAdminServices.and.returnValue(throwError(() => new Error('Error de conexión')));

    component.loadData();

    expect(component.services.length).toBe(0);
    expect(Swal.fire).toHaveBeenCalled();
  });
});
