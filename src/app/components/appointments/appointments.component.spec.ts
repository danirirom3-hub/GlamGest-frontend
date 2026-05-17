/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppointmentsComponent } from './appointments.component';
import { CashService } from '../../services/cash.service';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('AppointmentsComponent', () => {
  let component: AppointmentsComponent;
  let fixture: ComponentFixture<AppointmentsComponent>;

  // Spys de los servicios correctamente tipados
  let cashServiceSpy: jasmine.SpyObj<CashService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let appointmentsServiceSpy: jasmine.SpyObj<AppointmentsService>;
  let clientsServiceSpy: jasmine.SpyObj<ClientsService>;
  let employeesServiceSpy: jasmine.SpyObj<EmployeesService>;
  let servicesServiceSpy: jasmine.SpyObj<ServicesService>;

  // Datos mock base para las pruebas
  const mockClients = [{ id: 1, name: 'Daniela Rincon' }];
  const mockEmployees = [{ id: 1, name: 'Angie Sosa' }];
  const mockServices = [{ id: 1, name: 'Corte de Cabello' }];
  const mockAppointments = [
    {
      id: 10,
      clientId: 1,
      employeeId: 1,
      serviceId: 1,
      appointmentDatetime: '2026-05-20T10:00:00',
      notes: 'Nota de prueba',
      status: 'Pending'
    }
  ];

  beforeEach(async () => {
    cashServiceSpy = jasmine.createSpyObj('CashService', ['addItemFromAppointment']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    appointmentsServiceSpy = jasmine.createSpyObj('AppointmentsService', ['getAppointments', 'createAppointment', 'deleteAppointment']);
    clientsServiceSpy = jasmine.createSpyObj('ClientsService', ['getClients']);
    employeesServiceSpy = jasmine.createSpyObj('EmployeesService', ['getEmployees']);
    servicesServiceSpy = jasmine.createSpyObj('ServicesService', ['getServices']);

    // Configuración de respuestas por defecto para observables
    clientsServiceSpy.getClients.and.returnValue(of(mockClients));
    employeesServiceSpy.getEmployees.and.returnValue(of(mockEmployees));
    servicesServiceSpy.getServices.and.returnValue(of(mockServices));
    appointmentsServiceSpy.getAppointments.and.returnValue(of(mockAppointments));

    await TestBed.configureTestingModule({
      imports: [AppointmentsComponent],
      providers: [
        { provide: CashService, useValue: cashServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AppointmentsService, useValue: appointmentsServiceSpy },
        { provide: ClientsService, useValue: clientsServiceSpy },
        { provide: EmployeesService, useValue: employeesServiceSpy },
        { provide: ServicesService, useValue: servicesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsComponent);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar los datos iniciales y mapear las citas correctamente en ngOnInit', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit y suscribe los métodos

    expect(clientsServiceSpy.getClients).toHaveBeenCalled();
    expect(employeesServiceSpy.getEmployees).toHaveBeenCalled();
    expect(servicesServiceSpy.getServices).toHaveBeenCalled();
    expect(appointmentsServiceSpy.getAppointments).toHaveBeenCalled();

    expect(component.clients.length).toBe(1);
    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].client).toBe('Daniela Rincon');
    expect(component.appointments[0].status).toBe('pending');
  });

  it('debería manejar errores al cargar citas', () => {
    spyOn(Swal, 'fire');
    appointmentsServiceSpy.getAppointments.and.returnValue(throwError(() => new Error('Error de red')));
    
    fixture.detectChanges();

    expect(component.appointments.length).toBe(0);
    expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudieron cargar las citas.', 'error');
  });

  describe('scheduleAppointment', () => {
    it('debería mostrar advertencia si los campos están incompletos', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();
      
      component.selectedClient = ''; // Campo vacío para detonar el error
      component.scheduleAppointment();

      expect(Swal.fire).toHaveBeenCalledWith('Campos incompletos', 'Debes llenar todos los campos.', 'warning');
    });

    it('debería crear una cita exitosamente y reiniciar el formulario', () => {
      spyOn(Swal, 'fire');
      fixture.detectChanges();

      // Rellenar formulario simulado
      component.selectedClient = 'Daniela Rincon';
      component.selectedEmployee = { id: 1, name: 'Angie Sosa' };
      component.selectedService = { id: 1, name: 'Corte de Cabello' };
      component.selectedDate = '2026-05-22';
      component.selectedTime = '14:30';
      component.details = 'Sin detalles';

      const mockResponse = {
        successful: true,
        data: { id: 11 }
      };
      appointmentsServiceSpy.createAppointment.and.returnValue(of(mockResponse));

      component.scheduleAppointment();

      expect(appointmentsServiceSpy.createAppointment).toHaveBeenCalled();
      expect(component.appointments.some(a => a.id === 11)).toBeTrue();
      expect(Swal.fire).toHaveBeenCalled();
      expect(component.selectedDate).toBe(''); // Verifica que se limpió el formulario
    });
  });

  describe('sendToCash', () => {
    it('debería enviar la cita a caja y redirigir si el usuario confirma', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      fixture.detectChanges();

      const appointmentSample = component.appointments[0];
      component.sendToCash(appointmentSample);
      
      tick(); // Procesa la promesa de SweetAlert

      expect(cashServiceSpy.addItemFromAppointment).toHaveBeenCalledWith(appointmentSample);
      expect(appointmentSample.status).toBe('sent_to_cash');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/ventas']);
    }));

    it('no debería hacer nada si el usuario cancela en SweetAlert', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
      fixture.detectChanges();

      const appointmentSample = component.appointments[0];
      component.sendToCash(appointmentSample);
      
      tick();

      expect(cashServiceSpy.addItemFromAppointment).not.toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('deleteAppointment', () => {
    it('debería eliminar la cita si se confirma la acción', fakeAsync(() => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      appointmentsServiceSpy.deleteAppointment.and.returnValue(of({}));
      fixture.detectChanges();

      const appToDelete = component.appointments[0];
      component.deleteAppointment(appToDelete);
      
      tick();

      expect(appointmentsServiceSpy.deleteAppointment).toHaveBeenCalledWith(appToDelete.id);
      expect(component.appointments.length).toBe(0);
    }));
  });

  describe('Filtros', () => {
    it('debería filtrar las citas por cliente de forma insensible a mayúsculas', () => {
      fixture.detectChanges();
      
      component.appointments = [
        { id: 1, client: 'Daniela', employee: 'Angie', service: 'Uñas', date: '2026-05-20', time: '10:00', status: 'pending' },
        { id: 2, client: 'Carlos', employee: 'Angie', service: 'Corte', date: '2026-05-21', time: '11:00', status: 'pending' }
      ];

      component.filterClient = 'dan';
      let filtradas = component.filteredAppointments();
      expect(filtradas.length).toBe(1);
      expect(filtradas[0].client).toBe('Daniela');
    });
  });

  describe('selectService', () => {
    it('debería seleccionar un servicio o desmarcarlo si ya estaba seleccionado', () => {
      const servicio = { id: 5, name: 'Manicura' };
      
      component.selectService(servicio);
      expect(component.selectedService).toEqual(servicio);

      component.selectService(servicio);
      expect(component.selectedService).toBeNull();
    });
  });
});