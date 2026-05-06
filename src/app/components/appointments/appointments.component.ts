import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CashService } from '../../services/cash.service';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';

import Swal from 'sweetalert2';

interface Appointment {
  id: number;
  client: string;
  employee: string;
  service: string;
  date: string;
  time: string;
  details?: string;
  status: 'pending' | 'sent_to_cash';
}

interface Service {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {

  constructor(
    private cashService: CashService,
    private router: Router,
    private appointmentsService: AppointmentsService,
    private clientsService: ClientsService,
    private employeesService: EmployeesService,
    private servicesService: ServicesService
  ) {}

  view: 'create' | 'list' | 'calendar' = 'create';
  selectedService: Service | null = null;
  selectedEmployee: Employee | null = null;
  selectedClient = '';
  selectedDate = '';
  selectedTime = '';
  details = '';
  showConfirmation = false;
  isLoading = false;

  appointments: Appointment[] = [];

  filterClient = '';
  filterEmployee = '';
  filterDate = '';

  services: Service[] = [];
  employees: Employee[] = [];
  clients: any[] = [];

  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: esLocale,
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },
    height: 'auto',
    expandRows: true,
    eventDisplay: 'block',
    events: [],
    eventDidMount: (info: any) => {
      info.el.style.transition = 'all 0.2s ease';
    }
  };

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.clientsService.getClients().subscribe({
      next: (clientsRes: any) => {
        this.clients = clientsRes?.data || clientsRes || [];
        // Autoseleccionar primer cliente si existe
        if (this.clients.length > 0) this.selectedClient = this.clients[0].name;

        this.employeesService.getEmployees().subscribe({
          next: (empRes: any) => {
            this.employees = empRes?.data || empRes || [];
            // Autoseleccionar primer empleado si existe
            if (this.employees.length > 0) this.selectedEmployee = this.employees[0];

            this.servicesService.getServices().subscribe({
              next: (servRes: any) => {
                this.services = servRes?.data || servRes || [];
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
        this.appointments = apiAppointments.map((app: any) => ({
          id: app.id,
          client: this.getClientName(app.clientId),
          employee: this.getEmployeeName(app.employeeId),
          service: this.getServiceName(app.serviceId),
          date: new Date(app.appointmentDatetime).toISOString().split('T')[0],
          time: new Date(app.appointmentDatetime).toTimeString().slice(0, 5),
          details: app.notes || '',
          status: app.status === 'Pending' ? 'pending' : 'sent_to_cash'
        }));
        this.updateCalendarEvents();
      },
      error: () => {
        this.appointments = [];
        Swal.fire('Error', 'No se pudieron cargar las citas.', 'error');
      }
    });
  }

  scheduleAppointment(): void {

    // evitar doble clic
    if (this.isLoading) return;

    if (!this.selectedClient || !this.selectedEmployee || !this.selectedDate || !this.selectedTime || !this.selectedService) {
      Swal.fire('Campos incompletos', 'Debes llenar todos los campos.', 'warning');
      return;
    }

    const appointmentDatetime = `${this.selectedDate}T${this.selectedTime}`;
    const client = this.clients.find(c => c.name === this.selectedClient);
    const employee = this.employees.find(e => e.id === this.selectedEmployee!.id);
    const service = this.services.find(s => s.id === this.selectedService!.id);

    if (!client || !employee || !service) return;

    this.isLoading = true;

    this.appointmentsService.createAppointment({
      appointmentDatetime,
      clientId: client.id,
      employeeId: employee.id,
      serviceId: service.id,
      notes: this.details
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res?.successful) {

          this.appointments.push({
            id: res.data.id,
            client: this.selectedClient,
            employee: this.selectedEmployee!.name,
            service: this.selectedService!.name,
            date: this.selectedDate,
            time: this.selectedTime,
            details: this.details,
            status: 'pending'
          });

          this.updateCalendarEvents();

          Swal.fire({
            icon: 'success',
            title: 'Cita agendada',
            text: 'La cita fue registrada correctamente',
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'No se pudo agendar la cita.', 'error');
      }
    });
  }

  // enviar a caja
  sendToCash(app: Appointment): void {

    Swal.fire({
      title: 'Enviar a caja',
      text: `${app.client} - ${app.service}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then(result => {

      if (!result.isConfirmed) return;

      this.cashService.addItemFromAppointment(app);
      app.status = 'sent_to_cash';

      Swal.fire({
        icon: 'success',
        title: 'Enviado a caja',
        timer: 1000,
        showConfirmButton: false
      });

      this.router.navigate(['/ventas']);
    });
  }

  // elimina cita
  deleteAppointment(app: Appointment): void {

    Swal.fire({
      title: '¿Eliminar cita?',
      text: `${app.client} - ${app.service}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (result.isConfirmed) {

        this.appointmentsService.deleteAppointment(app.id).subscribe({
          next: () => {

            this.appointments = this.appointments.filter(a => a.id !== app.id);
            this.updateCalendarEvents();

            Swal.fire({
              icon: 'success',
              title: 'Eliminada',
              text: 'La cita fue eliminada',
              timer: 1200,
              showConfirmButton: false
            });

          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar la cita.', 'error');
          }
        });

      }

    });
  }

  selectService(service: Service): void {
    this.selectedService = this.selectedService?.id === service.id ? null : service;
  }

  resetForm(): void {
    if (this.clients.length > 0) this.selectedClient = this.clients[0].name;
    if (this.employees.length > 0) this.selectedEmployee = this.employees[0];
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedService = null;
    this.details = '';
  }

  filteredAppointments(): Appointment[] {
    return this.appointments.filter(a =>
      (!this.filterClient || a.client.toLowerCase().includes(this.filterClient.toLowerCase())) &&
      (!this.filterEmployee || a.employee.toLowerCase().includes(this.filterEmployee.toLowerCase())) &&
      (!this.filterDate || a.date === this.filterDate)
    );
  }

  updateCalendarEvents(): void {
    this.calendarOptions.events = this.appointments.map(app => ({
      id: app.id,
      title: `${app.client} - ${app.service}`,
      start: `${app.date}T${app.time}`,
      extendedProps: { details: app.details }
    }));
  }

  getClientName(clientId: number): string {
    return this.clients.find(c => c.id === clientId)?.name || 'Desconocido';
  }

  getEmployeeName(employeeId: number): string {
    return this.employees.find(e => e.id === employeeId)?.name || 'Desconocido';
  }

  getServiceName(serviceId: number): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Desconocido';
  }
}