/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EmployeesComponent } from './employees.component';
import { EmployeesService } from '../../services/employees.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('EmployeesComponent', () => {
  let component: EmployeesComponent;
  let fixture: ComponentFixture<EmployeesComponent>;
  let employeesServiceSpy: jasmine.SpyObj<EmployeesService>;

  // Lista mock con empleados activos e inactivos para probar los filtros
  const mockEmployeesList = [
    { id: 1, name: 'Daniela Rincon', phone: '3111111111', active: true },
    { id: 2, name: 'Angie Sosa', phone: '3222222222', active: false }
  ];

  beforeEach(async () => {
    employeesServiceSpy = jasmine.createSpyObj('EmployeesService', [
      'getEmployees',
      'createEmployee',
      'updateEmployee',
      'deleteEmployee'
    ]);

    // Configuración por defecto al inicializar
    employeesServiceSpy.getEmployees.and.returnValue(of({ data: mockEmployeesList }));

    await TestBed.configureTestingModule({
      imports: [EmployeesComponent], // Al ser Standalone se pasa a imports
      providers: [
        { provide: EmployeesService, useValue: employeesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar todos los empleados en ngOnInit', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(employeesServiceSpy.getEmployees).toHaveBeenCalled();
    expect(component.employees.length).toBe(2);
  });

  describe('Getter: visibleEmployees', () => {
    it('debería retornar todos los empleados si showOnlyActive es false', () => {
      fixture.detectChanges();
      component.showOnlyActive = false;

      expect(component.visibleEmployees.length).toBe(2);
    });

    it('debería retornar solo los empleados activos si showOnlyActive es true', () => {
      fixture.detectChanges();
      component.showOnlyActive = true;

      expect(component.visibleEmployees.length).toBe(1);
      expect(component.visibleEmployees[0].name).toBe('Daniela Rincon');
    });
  });

  describe('onSubmit', () => {
    it('debería alertar si el nombre o teléfono están vacíos', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.employee = { id: 0, name: '', phone: '', active: true };
      component.onSubmit();

      expect(Swal.fire).toHaveBeenCalledWith('Campos incompletos', 'Completa todos los campos antes de guardar.', 'warning');
    });

    it('debería crear un empleado nuevo exitosamente', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.employee = { id: 0, name: 'Nuevo Empleado', phone: '5555', active: true };
      component.isEditing = false;

      const mockResponse = {
        successful: true,
        data: { id: 3, name: 'Nuevo Empleado', phone: '5555', active: true }
      };
      employeesServiceSpy.createEmployee.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(employeesServiceSpy.createEmployee).toHaveBeenCalledWith({ name: 'Nuevo Empleado', phone: '5555' });
      expect(component.employees.length).toBe(3);
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('debería llamar a updateEmployee si isEditing es true', () => {
      fixture.detectChanges();
      component.isEditing = true;
      spyOn(component, 'updateEmployee');

      component.onSubmit();

      expect(component.updateEmployee).toHaveBeenCalled();
    });
  });

  describe('onEdit', () => {
    it('debería cargar el formulario con el empleado y activar modo edición', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      const emp = mockEmployeesList[0];
      component.onEdit(emp);

      expect(component.isEditing).toBeTrue();
      expect(component.employee.id).toBe(emp.id);
      expect(component.employee.name).toBe(emp.name);
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  describe('updateEmployee', () => {
    it('debería actualizar el empleado mapeado en la lista tras respuesta exitosa', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.employee = { id: 1, name: 'Daniela Editada', phone: '9999', active: true };
      
      const mockResponse = {
        successful: true,
        data: { id: 1, name: 'Daniela Editada', phone: '9999', active: true }
      };
      employeesServiceSpy.updateEmployee.and.returnValue(of(mockResponse));

      component.updateEmployee();

      expect(employeesServiceSpy.updateEmployee).toHaveBeenCalledWith(1, { name: 'Daniela Editada', phone: '9999' });
      expect(component.employees[0].name).toBe('Daniela Editada');
      expect(component.isEditing).toBeFalse();
    });
  });

  describe('onDelete', () => {
    it('debería remover el empleado si se confirma el cuadro de diálogo', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      employeesServiceSpy.deleteEmployee.and.returnValue(of({}));
      fixture.detectChanges();

      component.onDelete(1);
      tick();

      expect(employeesServiceSpy.deleteEmployee).toHaveBeenCalledWith(1);
      expect(component.employees.length).toBe(1);
      expect(component.employees.some(e => e.id === 1)).toBeFalse();
    }));
  });

  describe('onCancel', () => {
    it('debería limpiar el formulario al cancelar la edición', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      component.isEditing = true;
      component.employee = { id: 5, name: 'Modificado', phone: '123', active: true };

      component.onCancel();

      expect(component.isEditing).toBeFalse();
      expect(component.employee.id).toBe(0);
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  describe('toggleActive', () => {
    it('debería cambiar el estado de activo del empleado si se confirma', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      
      const empTarget = { id: 1, name: 'Daniela Rincon', phone: '3111111111', active: true };
      const mockResponse = { successful: true };
      
      employeesServiceSpy.updateEmployee.and.returnValue(of(mockResponse));
      fixture.detectChanges();

      component.toggleActive(empTarget);
      tick();

      // Debe llamar al servicio invirtiendo la propiedad active
      expect(employeesServiceSpy.updateEmployee).toHaveBeenCalledWith(1, jasmine.objectContaining({ active: false }));
      expect(component.employees[0].active).toBeFalse();
    }));
  });
});