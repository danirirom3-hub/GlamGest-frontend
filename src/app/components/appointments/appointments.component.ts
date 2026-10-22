import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AppointmentsService } from '../../services/appointments.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClientsService } from '../../services/clients.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';
import { ScheduleService, BusinessHours, BusinessScheduleException, EmployeeUnavailability } from '../../services/schedule.service';
import { ApiErrorMapper } from '../../services/api-error.mapper';

import Swal from 'sweetalert2';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface Appointment {
  id: number;
  clientId: number;
  employeeId: number;
  serviceId: number;
  durationMinutes: number;
  billed: boolean;
  performedByEmployeeId: number | null;
  client: string;
  employee: string;
  service: string;
  date: string;
  time: string;
  details?: string;
  status: AppointmentStatus;
}

interface Service {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
}

interface Employee {
  id: number;
  name: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {

  constructor(
    private router: Router,
    private appointmentsService: AppointmentsService,
    private clientsService: ClientsService,
    private employeesService: EmployeesService,
    private servicesService: ServicesService,
    private scheduleService: ScheduleService,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) {}

  view: 'create' | 'list' | 'calendar' = 'create';
  selectedServices: Service[] = [];
  selectedEmployee: Employee | null = null;
  selectedClientId: number | null = null;
  selectedDate = '';
  selectedTime = '';
  details = '';
  showConfirmation = false;
  isLoading = false;
  gridDate = this.toInputDate(new Date());
  isScheduleLoading = false;
  businessHours: BusinessHours[] = [];
  exceptions: BusinessScheduleException[] = [];
  employeeBlocks: EmployeeUnavailability[] = [];
  readonly slotHeight = 44;
  draggedAppointment: Appointment | null = null;

  appointments: Appointment[] = [];

  filterClient = '';
  filterEmployee = '';
  filterDate = '';

  services: Service[] = [];
  employees: Employee[] = [];
  clients: any[] = [];

  ngOnInit(): void {
    this.loadInitialData();
    this.loadGridSchedule();
  }

  setView(view: 'create' | 'list' | 'calendar'): void {
    this.view = view;
    if (view === 'calendar') this.loadGridSchedule();
  }

  loadInitialData(): void {
    this.clientsService.getClients().subscribe({
      next: (clientsRes: any) => {
        this.clients = clientsRes?.data?.items || clientsRes?.data || clientsRes || [];
        if (this.clients.length > 0) this.selectedClientId = this.getClientId(this.clients[0]);

        this.employeesService.getEmployees().subscribe({
          next: (empRes: any) => {
            this.employees = (empRes?.data || empRes || []).map((employee: any) => ({
              id: employee.id ?? employee.employee_id,
              name: employee.name
            }));
            if (this.employees.length > 0) this.selectedEmployee = this.employees[0];

            this.servicesService.getServices().subscribe({
              next: (servRes: any) => {
                this.services = (servRes?.data || servRes || []).map((service: any) => ({
                  id: service.id ?? service.service_id,
                  name: service.name,
                  durationMinutes: service.durationMinutes ?? service.duration_minutes ?? 15,
                  price: service.price ?? 0
                }));
                this.loadAppointments();
              }
            });
          }
        });
      }
    });
  }

  loadAppointments(): void {
    this.appointmentsService.getAppointments().subscribe({
      next: (res: any) => {
        const apiAppointments = res?.data || res || [];
        this.appointments = apiAppointments.map((app: any) => {
          const parts = this.businessDateTimeParts(app.appointmentDatetime);
          const status = String(app.status || 'PENDING').toUpperCase() as AppointmentStatus;
          return {
            id: app.id,
            clientId: app.clientId,
            employeeId: app.employeeId,
            serviceId: app.serviceId,
            durationMinutes: app.durationMinutes ?? this.findServiceDuration(app.serviceId),
            billed: Boolean(app.billed),
            performedByEmployeeId: app.performedByEmployeeId ?? null,
            client: this.getClientName(app.clientId),
            employee: this.getEmployeeName(app.employeeId),
            service: this.getServiceName(app.serviceId),
            date: parts.date,
            time: parts.time,
            details: app.notes || '',
            status
          };
        });
      },
      error: () => {
        this.appointments = [];
        Swal.fire(this.translate.instant('common.error'), this.translate.instant('appointments.loadError'), 'error');
      }
    });
  }

  scheduleAppointment(): void {
    if (this.isLoading) return;

    if (!this.selectedClientId || !this.selectedEmployee || !this.selectedDate || !this.selectedTime || this.selectedServices.length === 0) {
      Swal.fire(this.translate.instant('common.error'), this.translate.instant('appointments.incomplete'), 'warning');
      return;
    }

    const appointmentDatetime = `${this.selectedDate}T${this.selectedTime}`;
    const employee = this.employees.find(e => e.id === this.selectedEmployee!.id);
    if (!employee) return;

    this.isLoading = true;

    this.appointmentsService.createAppointmentsBatch({
      appointmentDatetime,
      clientId: this.selectedClientId,
      employeeId: employee.id,
      serviceIds: this.selectedServices.map(service => service.id),
      notes: this.details
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.successful) {
          this.loadAppointments();

          Swal.fire({
            icon: 'success',
            title: this.translate.instant('appointments.createdTitle'),
            text: this.translate.instant('appointments.createdText'),
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire(this.translate.instant('common.error'), this.translate.instant('appointments.createError'), 'error');
      }
    });
  }

  sendToCash(app: Appointment): void {
    if (!this.canSendToCash(app)) return;
    void this.router.navigate(['/dashboard/sales'], { queryParams: { appointmentId: app.id } });
  }

  openAppointmentActions(app: Appointment): void {
    const transitions = this.allowedStatusTransitions(app.status);
    const statusOptions = Object.fromEntries(transitions.map(status => [status, this.statusLabel(status)]));
    Swal.fire({
      title: `${app.client} · ${app.service}`,
      text: `${app.date} ${app.time} · ${app.employee}`,
      icon: 'info',
      input: transitions.length ? 'select' : undefined,
      inputOptions: statusOptions,
      inputPlaceholder: this.translate.instant('appointments.changeStatusPlaceholder'),
      showCancelButton: true,
      showConfirmButton: transitions.length > 0,
      showDenyButton: this.canSendToCash(app),
      confirmButtonText: this.translate.instant('appointments.changeStatus'),
      denyButtonText: this.translate.instant('appointments.sendToCashTitle'),
      cancelButtonText: this.translate.instant('common.close'),
      preConfirm: value => {
        if (transitions.length && !value) {
          Swal.showValidationMessage(this.translate.instant('appointments.changeStatusPlaceholder'));
        }
        return value;
      }
    }).then(result => {
      if (result.isDenied) {
        this.sendToCash(app);
      } else if (result.isConfirmed && result.value) {
        this.changeAppointmentStatus(app, result.value as AppointmentStatus);
      }
    });
  }

  private allowedStatusTransitions(status: AppointmentStatus): AppointmentStatus[] {
    if (status === 'PENDING') return ['CONFIRMED', 'CANCELLED'];
    if (status === 'CONFIRMED') return ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
    return [];
  }

  private canSendToCash(appointment: Appointment): boolean {
    return !appointment.billed && appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW';
  }

  statusLabel(status: AppointmentStatus): string {
    return this.translate.instant(`metrics.status.${status}`);
  }

  private changeAppointmentStatus(appointment: Appointment, status: AppointmentStatus): void {
    this.appointmentsService.updateAppointmentStatus(appointment.id, status).subscribe({
      next: () => {
        this.loadAppointments();
        Swal.fire({
          icon: 'success',
          title: this.translate.instant('appointments.statusUpdated'),
          timer: 1100,
          showConfirmButton: false
        });
      },
      error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('appointments.statusError')), 'error')
    });
  }

  deleteAppointment(app: Appointment): void {
    Swal.fire({
      title: this.translate.instant('appointments.deleteTitle'),
      text: `${app.client} - ${app.service}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesDelete'),
      cancelButtonText: this.translate.instant('common.cancel'),
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.appointmentsService.deleteAppointment(app.id).subscribe({
          next: () => {
            this.appointments = this.appointments.filter(a => a.id !== app.id);
            Swal.fire({
              icon: 'success',
              title: this.translate.instant('appointments.deletedTitle'),
              text: this.translate.instant('appointments.deletedText'),
              timer: 1200,
              showConfirmButton: false
            });
          },
          error: () => {
            Swal.fire(this.translate.instant('common.error'), this.translate.instant('appointments.deleteError'), 'error');
          }
        });
      }
    });
  }

  loadGridSchedule(): void {
    if (!this.gridDate) return;
    this.isScheduleLoading = true;
    const dayStart = `${this.gridDate}T00:00:00`;
    const dayEnd = `${this.gridDate}T23:59:59`;
    forkJoin({
      hours: this.scheduleService.getBusinessHours(),
      exceptions: this.scheduleService.getExceptions(this.gridDate, this.gridDate),
      employeeBlocks: this.scheduleService.getEmployeeBlocks(dayStart, dayEnd)
    }).subscribe({
      next: result => {
        this.businessHours = result.hours?.data || [];
        this.exceptions = result.exceptions?.data || [];
        this.employeeBlocks = result.employeeBlocks?.data || [];
      },
      error: error => {
        this.businessHours = [];
        this.exceptions = [];
        this.employeeBlocks = [];
        void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('appointments.loadError')), 'error');
      },
      complete: () => this.isScheduleLoading = false
    });
  }

  changeGridDate(date: string): void {
    this.gridDate = date;
    this.loadGridSchedule();
  }

  moveGridDate(days: number): void {
    if (!this.gridDate) return;
    const [year, month, day] = this.gridDate.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    date.setDate(date.getDate() + days);
    this.changeGridDate(this.toInputDate(date));
  }

  get scheduleHoursForDay(): BusinessHours | BusinessScheduleException | undefined {
    const exception = this.exceptions.find(item => item.date === this.gridDate);
    if (exception) return exception;
    const dayOfWeek = this.dayOfWeek(this.gridDate);
    return this.businessHours.find(item => item.dayOfWeek === dayOfWeek);
  }

  get isGridClosed(): boolean {
    return Boolean(this.scheduleHoursForDay?.closed);
  }

  get timeSlots(): string[] {
    const hours = this.scheduleHoursForDay;
    if (!hours || hours.closed || !hours.opensAt || !hours.closesAt) return [];
    const open = this.minutesOfDay(hours.opensAt);
    const close = this.minutesOfDay(hours.closesAt);
    const slots: string[] = [];
    for (let minutes = open; minutes < close; minutes += 15) {
      slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    }
    return slots;
  }

  get gridColumns(): string {
    return `72px repeat(${Math.max(this.employees.length, 1)}, minmax(170px, 1fr))`;
  }

  get gridBodyHeight(): number {
    return this.timeSlots.length * this.slotHeight;
  }

  get selectedDurationMinutes(): number {
    return this.selectedServices.reduce((total, service) => total + service.durationMinutes, 0);
  }

  get gridDateLabel(): string {
    if (!this.gridDate) return '';
    const [year, month, day] = this.gridDate.split('-').map(Number);
    return new Intl.DateTimeFormat(this.translate.currentLang === 'en' ? 'en-US' : 'es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(year, month - 1, day, 12));
  }

  gridAppointmentsForEmployee(employeeId: number): Appointment[] {
    return this.appointments.filter(appointment => appointment.date === this.gridDate
      && appointment.employeeId === employeeId
      && this.gridTop(appointment) !== null);
  }

  gridTop(appointment: Appointment): number | null {
    const slotIndex = this.timeSlots.indexOf(appointment.time);
    return slotIndex < 0 ? null : slotIndex * this.slotHeight + 3;
  }

  gridHeight(appointment: Appointment): number {
    const serviceDuration = this.findServiceDuration(appointment.serviceId);
    return Math.max(1, Math.ceil((appointment.durationMinutes || serviceDuration || 15) / 15)) * this.slotHeight - 6;
  }

  isEmployeeBlocked(employeeId: number, time: string): boolean {
    const slotStart = `${this.gridDate}T${time}:00`;
    const [year, month, day] = this.gridDate.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const slotEndDate = new Date(year, month - 1, day, hours, minutes + 15);
    const slotEnd = `${this.toInputDate(slotEndDate)}T${String(slotEndDate.getHours()).padStart(2, '0')}:${String(slotEndDate.getMinutes()).padStart(2, '0')}:00`;
    return this.employeeBlocks.some(block => {
      if (block.employeeId !== employeeId) return false;
      return block.startsAt < slotEnd && block.endsAt > slotStart;
    });
  }

  createAppointmentAt(employee: Employee, time: string): void {
    if (this.isEmployeeBlocked(employee.id, time) || this.isGridClosed) return;
    this.selectedEmployee = employee;
    this.selectedDate = this.gridDate;
    this.selectedTime = time;
    this.selectedServices = [];
    this.details = '';
    this.setView('create');
  }

  startAppointmentDrag(event: DragEvent, appointment: Appointment): void {
    if (!this.canReschedule(appointment)) {
      event.preventDefault();
      return;
    }
    this.draggedAppointment = appointment;
    event.dataTransfer?.setData('text/plain', String(appointment.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowAppointmentDrop(event: DragEvent): void {
    if (!this.draggedAppointment) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  dropAppointment(event: DragEvent, employee: Employee): void {
    event.preventDefault();
    const draggedId = Number(event.dataTransfer?.getData('text/plain'));
    const appointment = this.draggedAppointment || this.appointments.find(item => item.id === draggedId);
    this.draggedAppointment = null;
    if (!appointment || !this.canReschedule(appointment)) return;

    const lane = event.currentTarget as HTMLElement;
    const offsetY = event.clientY - lane.getBoundingClientRect().top;
    const slotIndex = Math.floor(offsetY / this.slotHeight);
    const targetTime = this.timeSlots[slotIndex];
    if (!targetTime || this.isEmployeeBlocked(employee.id, targetTime)) return;
    if (appointment.employeeId === employee.id && appointment.time === targetTime && appointment.date === this.gridDate) return;

    const payload = {
      clientId: appointment.clientId,
      employeeId: employee.id,
      serviceId: appointment.serviceId,
      appointmentDatetime: `${this.gridDate}T${targetTime}:00`,
      durationMinutes: appointment.durationMinutes,
      notes: appointment.details || '',
      status: appointment.status
    };
    this.appointmentsService.updateAppointment(appointment.id, payload).subscribe({
      next: () => {
        this.loadAppointments();
        void Swal.fire({ icon: 'success', title: this.translate.instant('appointments.rescheduled'), timer: 1000, showConfirmButton: false });
      },
      error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('appointments.rescheduleError')), 'error')
    });
  }

  canReschedule(appointment: Appointment): boolean {
    return !appointment.billed && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');
  }

  hasDifferentActualEmployee(appointment: Appointment): boolean {
    return appointment.performedByEmployeeId !== null && appointment.performedByEmployeeId !== appointment.employeeId;
  }

  selectService(service: Service): void {
    const index = this.selectedServices.findIndex(item => item.id === service.id);
    if (index >= 0) this.selectedServices = this.selectedServices.filter(item => item.id !== service.id);
    else this.selectedServices = [...this.selectedServices, service];
  }

  isServiceSelected(serviceId: number): boolean {
    return this.selectedServices.some(service => service.id === serviceId);
  }

  resetForm(): void {
    if (this.clients.length > 0) this.selectedClientId = this.getClientId(this.clients[0]);
    if (this.employees.length > 0) this.selectedEmployee = this.employees[0];
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedServices = [];
    this.details = '';
  }

  filteredAppointments(): Appointment[] {
    return this.appointments.filter(a => {
      const matchClient = !this.filterClient || a.client.toLowerCase().includes(this.filterClient.toLowerCase());
      const matchEmployee = !this.filterEmployee || a.employee.toLowerCase().includes(this.filterEmployee.toLowerCase());
      const matchDate = !this.filterDate || a.date === this.filterDate;
      return matchClient && matchEmployee && matchDate;
    });
  }

  getClientName(clientId: number): string {
    return this.clients.find(c => this.getClientId(c) === clientId)?.name || this.translate.instant('common.unknown');
  }

  getEmployeeName(employeeId: number | null | undefined): string {
    if (employeeId === null || employeeId === undefined) return this.translate.instant('common.unknown');
    return this.employees.find(e => e.id === employeeId)?.name || this.translate.instant('common.unknown');
  }

  getServiceName(serviceId: number): string {
    return this.services.find(s => s.id === serviceId)?.name || this.translate.instant('common.unknown');
  }

  private findServiceDuration(serviceId: number): number {
    return this.services.find(service => service.id === serviceId)?.durationMinutes || 15;
  }

  private getClientId(client: any): number {
    return Number(client?.id ?? client?.client_id);
  }

  private dayOfWeek(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(year, month - 1, day, 12).getDay();
    return weekday === 0 ? 7 : weekday;
  }

  private minutesOfDay(time: string): number {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private toInputDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }

  private businessDateTimeParts(value: string): { date: string; time: string } {
    const date = new Date(value);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { date: `${values['year']}-${values['month']}-${values['day']}`, time: `${values['hour']}:${values['minute']}` };
  }
}
