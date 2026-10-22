/// <reference types="jasmine" />

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { provideTranslateService } from '@ngx-translate/core';
import { AppointmentsComponent } from './appointments.component';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';
import { ScheduleService } from '../../services/schedule.service';

describe('AppointmentsComponent', () => {
  let component: AppointmentsComponent;
  let fixture: ComponentFixture<AppointmentsComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let appointmentsServiceSpy: jasmine.SpyObj<AppointmentsService>;
  let clientsServiceSpy: jasmine.SpyObj<ClientsService>;
  let employeesServiceSpy: jasmine.SpyObj<EmployeesService>;
  let servicesServiceSpy: jasmine.SpyObj<ServicesService>;
  let scheduleServiceSpy: jasmine.SpyObj<ScheduleService>;

  const mockClients = [{ id: 1, name: 'Daniela Rincon' }];
  const mockEmployees = [{ id: 1, name: 'Angie Sosa' }];
  const mockServices = [{ id: 1, name: 'Corte de Cabello', durationMinutes: 30, price: 25000 }];
  const mockAppointments = [{
    id: 10,
    clientId: 1,
    employeeId: 1,
    serviceId: 1,
    durationMinutes: 30,
    billed: false,
    performedByEmployeeId: null,
    appointmentDatetime: '2026-05-20T10:00:00-05:00',
    notes: 'Nota de prueba',
    status: 'PENDING'
  }];

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    appointmentsServiceSpy = jasmine.createSpyObj('AppointmentsService', [
      'getAppointments', 'createAppointment', 'createAppointmentsBatch', 'updateAppointment',
      'updateAppointmentStatus', 'deleteAppointment'
    ]);
    clientsServiceSpy = jasmine.createSpyObj('ClientsService', ['getClients']);
    employeesServiceSpy = jasmine.createSpyObj('EmployeesService', ['getEmployees']);
    servicesServiceSpy = jasmine.createSpyObj('ServicesService', ['getServices']);
    scheduleServiceSpy = jasmine.createSpyObj('ScheduleService', [
      'getBusinessHours', 'getExceptions', 'getEmployeeBlocks', 'getAvailability'
    ]);

    clientsServiceSpy.getClients.and.returnValue(of(mockClients) as any);
    employeesServiceSpy.getEmployees.and.returnValue(of(mockEmployees) as any);
    servicesServiceSpy.getServices.and.returnValue(of(mockServices) as any);
    appointmentsServiceSpy.getAppointments.and.returnValue(of(mockAppointments) as any);
    scheduleServiceSpy.getBusinessHours.and.returnValue(of({ data: Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index + 1, closed: index === 6, opensAt: index === 6 ? null : '09:00', closesAt: index === 6 ? null : '19:00'
    })) }) as any);
    scheduleServiceSpy.getExceptions.and.returnValue(of({ data: [] }) as any);
    scheduleServiceSpy.getEmployeeBlocks.and.returnValue(of({ data: [] }) as any);

    await TestBed.configureTestingModule({
      imports: [AppointmentsComponent],
      providers: [
        provideTranslateService(),
        { provide: Router, useValue: routerSpy },
        { provide: AppointmentsService, useValue: appointmentsServiceSpy },
        { provide: ClientsService, useValue: clientsServiceSpy },
        { provide: EmployeesService, useValue: employeesServiceSpy },
        { provide: ServicesService, useValue: servicesServiceSpy },
        { provide: ScheduleService, useValue: scheduleServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsComponent);
    component = fixture.componentInstance;
  });

  it('loads appointments, catalogs and schedule data', () => {
    fixture.detectChanges();

    expect(clientsServiceSpy.getClients).toHaveBeenCalled();
    expect(employeesServiceSpy.getEmployees).toHaveBeenCalled();
    expect(servicesServiceSpy.getServices).toHaveBeenCalled();
    expect(appointmentsServiceSpy.getAppointments).toHaveBeenCalled();
    expect(scheduleServiceSpy.getBusinessHours).toHaveBeenCalled();
    expect(component.appointments[0].status).toBe('PENDING');
    expect(component.appointments[0].client).toBe('Daniela Rincon');
  });

  it('blocks creation if required booking fields are missing', () => {
    spyOn(Swal, 'fire');
    fixture.detectChanges();
    component.selectedClientId = null;

    component.scheduleAppointment();

    expect(Swal.fire).toHaveBeenCalledWith('common.error', 'appointments.incomplete', 'warning');
    expect(appointmentsServiceSpy.createAppointmentsBatch).not.toHaveBeenCalled();
  });

  it('sends selected services in order as one sequential booking request', () => {
    spyOn(Swal, 'fire');
    fixture.detectChanges();
    appointmentsServiceSpy.createAppointmentsBatch.and.returnValue(of({ successful: true, data: [] }) as any);
    component.selectedClientId = 1;
    component.selectedEmployee = { id: 1, name: 'Angie Sosa' };
    component.selectedServices = [
      { id: 1, name: 'Corte', durationMinutes: 30, price: 25000 },
      { id: 2, name: 'Peinado', durationMinutes: 45, price: 30000 }
    ];
    component.selectedDate = '2026-05-22';
    component.selectedTime = '14:30';

    component.scheduleAppointment();

    expect(appointmentsServiceSpy.createAppointmentsBatch).toHaveBeenCalledWith({
      appointmentDatetime: '2026-05-22T14:30',
      clientId: 1,
      employeeId: 1,
      serviceIds: [1, 2],
      notes: ''
    });
    expect(component.selectedServices).toEqual([]);
  });

  it('sends a selected appointment to the real sales route with its ID', () => {
    const appointment = { ...mockAppointments[0], client: 'Daniela', employee: 'Angie', service: 'Corte', date: '2026-05-20', time: '10:00' } as any;

    component.sendToCash(appointment);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/sales'], { queryParams: { appointmentId: 10 } });
  });

  it('does not send cancelled appointments to cash', () => {
    const appointment = { ...mockAppointments[0], status: 'CANCELLED' } as any;

    component.sendToCash(appointment);

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('filters appointments by client name case-insensitively', () => {
    fixture.detectChanges();
    component.filterClient = 'dan';

    expect(component.filteredAppointments().length).toBe(1);
    expect(component.filteredAppointments()[0].client).toBe('Daniela Rincon');
  });

  it('toggles multiple services while preserving their selection order', () => {
    const first = { id: 1, name: 'Corte', durationMinutes: 30, price: 25000 };
    const second = { id: 2, name: 'Peinado', durationMinutes: 45, price: 30000 };

    component.selectService(first);
    component.selectService(second);
    expect(component.selectedServices.map(service => service.id)).toEqual([1, 2]);
    expect(component.selectedDurationMinutes).toBe(75);

    component.selectService(first);
    expect(component.selectedServices.map(service => service.id)).toEqual([2]);
  });

  it('creates 15-minute time rows and sizes appointment blocks by their duration', () => {
    component.gridDate = '2026-05-20'; // Wednesday
    component.businessHours = [{ dayOfWeek: 3, closed: false, opensAt: '09:00', closesAt: '10:00' }];

    expect(component.timeSlots).toEqual(['09:00', '09:15', '09:30', '09:45']);
    expect(component.gridHeight({ ...mockAppointments[0], client: '', employee: '', service: '', date: '', time: '', status: 'PENDING' })).toBe(82);
  });

  it('deletes the appointment when the delete confirmation succeeds', fakeAsync(() => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    appointmentsServiceSpy.deleteAppointment.and.returnValue(of({}) as any);
    fixture.detectChanges();
    const appointment = component.appointments[0];

    component.deleteAppointment(appointment);
    tick();

    expect(appointmentsServiceSpy.deleteAppointment).toHaveBeenCalledWith(appointment.id);
    expect(component.appointments.length).toBe(0);
  }));
});
