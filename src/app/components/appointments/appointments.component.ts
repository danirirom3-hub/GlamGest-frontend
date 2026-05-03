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

interface Appointment {
  id: number;
  client: string;
  employee: string;
  service: string;
  date: string;
  time: string;
  details?: string; // 🔥 NUEVO
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
  details = ''; // 🔥 NUEVO

  showConfirmation = false;

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

    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },

    height: 'auto',
    expandRows: true,
    eventDisplay: 'block',

    events: [],

    eventDidMount: (info: any) => {
      info.el.style.transition = 'all 0.2s ease';
    }
  };

  ngOnInit(): void {
    // 🔥 CARGA ORDENADA (MUY IMPORTANTE)
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.clientsService.getClients().subscribe({
      next: (clientsRes: any) => {
        this.clients = clientsRes?.data || clientsRes || [];

        this.employeesService.getEmployees().subscribe({
          next: (empRes: any) => {
            this.employees = empRes?.data || empRes || [];

            this.servicesService.getServices().subscribe({
              next: (servRes: any) => {
                this.services = servRes?.data || servRes || [];

                // 👉 SOLO AQUÍ cargamos citas
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
      }
    });
  }

  scheduleAppointment(): void {
    if (!this.selectedClient || !this.selectedEmployee || !this.selectedDate || !this.selectedTime || !this.selectedService) {
      return;
    }

    const appointmentDatetime = `${this.selectedDate}T${this.selectedTime}`;

    const client = this.clients.find(c => c.name === this.selectedClient);
    const employee = this.employees.find(e => e.name === this.selectedEmployee!.name);
    const service = this.services.find(s => s.name === this.selectedService!.name);

    if (!client || !employee || !service) {
      return;
    }

    this.appointmentsService.createAppointment({
      appointmentDatetime,
      clientId: client.id,
      employeeId: employee.id,
      serviceId: service.id,
      notes: this.details
    }).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          const newApp: Appointment = {
            id: res.data.id,
            client: this.selectedClient,
            employee: this.selectedEmployee!.name,
            service: this.selectedService!.name,
            date: this.selectedDate,
            time: this.selectedTime,
            details: this.details,
            status: 'pending'
          };

          this.appointments.push(newApp);
          this.updateCalendarEvents();

          this.showConfirmation = true;
          setTimeout(() => this.showConfirmation = false, 2000);

          this.resetForm();
        }
      },
      error: (err) => {
        console.error('Error creating appointment:', err);
      }
    });
  }

  sendToCash(app: Appointment): void {
    this.cashService.addItemFromAppointment(app);
    app.status = 'sent_to_cash';
    this.router.navigate(['/ventas']);
  }

  deleteAppointment(app: Appointment): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      this.appointmentsService.deleteAppointment(app.id).subscribe({
        next: () => {
          this.appointments = this.appointments.filter(a => a.id !== app.id);
          this.updateCalendarEvents();
        },
        error: (err) => {
          console.error('Error deleting appointment', err);
        }
      });
    }
  }

  selectService(service: Service): void {
    this.selectedService = this.selectedService?.id === service.id ? null : service;
  }

  resetForm(): void {
    this.selectedClient = '';
    this.selectedEmployee = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedService = null;
    this.details = ''; // 🔥 LIMPIAR
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
      extendedProps: {
        details: app.details // 🔥 listo para tooltip futuro
      }
    }));
  }

  getClientName(clientId: number): string {
    const client = this.clients.find(c => c.id === clientId);
    return client?.name || 'Desconocido';
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee?.name || 'Desconocido';
  }

  getServiceName(serviceId: number): string {
    const service = this.services.find(s => s.id === serviceId);
    return service?.name || 'Desconocido';
  }
}