import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { CashService } from '../../services/cash.service';

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
export class AppointmentsComponent {

  constructor(
    private cashService: CashService,
    private router: Router
  ) {}

  view: 'create' | 'list' | 'calendar' = 'create';

  selectedService: Service | null = null;
  selectedEmployee: Employee | null = null;

  selectedClient = '';
  selectedDate = '';
  selectedTime = '';

  showConfirmation = false;

  appointments: Appointment[] = [];
  private idCounter = 1;

  filterClient = '';
  filterEmployee = '';
  filterDate = '';

  services: Service[] = [];
  employees: Employee[] = [];

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

  scheduleAppointment(): void {

    if (!this.selectedClient ||
        !this.selectedEmployee ||
        !this.selectedDate ||
        !this.selectedTime ||
        !this.selectedService) return;

    const newApp: Appointment = {
      id: this.idCounter++,
      client: this.selectedClient,
      employee: this.selectedEmployee.name,
      service: this.selectedService.name,
      date: this.selectedDate,
      time: this.selectedTime,
      status: 'pending'
    };

    this.appointments.push(newApp);

    this.calendarOptions.events = [
      ...this.calendarOptions.events,
      {
        id: newApp.id,
        title: `${newApp.client} - ${newApp.service}`,
        start: `${newApp.date}T${newApp.time}`
      }
    ];

    this.showConfirmation = true;
    setTimeout(() => this.showConfirmation = false, 2000);

    this.resetForm();
  }

  // 🔥 MÉTODO CLAVE (AQUÍ PASA TODO)
  sendToCash(app: Appointment): void {
    this.cashService.addItemFromAppointment(app);

    app.status = 'sent_to_cash';

    // 👉 redirige a ventas (caja)
    this.router.navigate(['/ventas']);
  }

  selectService(service: Service): void {
    this.selectedService =
      this.selectedService?.id === service.id ? null : service;
  }

  resetForm(): void {
    this.selectedClient = '';
    this.selectedEmployee = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedService = null;
  }

  filteredAppointments(): Appointment[] {
    return this.appointments.filter(a =>
      (!this.filterClient || a.client.toLowerCase().includes(this.filterClient.toLowerCase())) &&
      (!this.filterEmployee || a.employee.toLowerCase().includes(this.filterEmployee.toLowerCase())) &&
      (!this.filterDate || a.date === this.filterDate)
    );
  }
}