import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent {

  view: 'create' | 'list' | 'calendar' = 'create';

  selectedService: number | null = null;

  selectedClient = '';
  selectedEmployee = '';
  selectedDate = '';
  selectedTime = '';

  showConfirmation = false;

  appointments: Appointment[] = [];
  private idCounter = 1;

  filterClient = '';
  filterEmployee = '';
  filterDate = '';

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
        !this.selectedTime) return;

    const newApp: Appointment = {
      id: this.idCounter++,
      client: this.selectedClient,
      employee: this.selectedEmployee,
      service: this.getServiceName(),
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

  sendToCash(app: Appointment): void {
    app.status = 'sent_to_cash';
  }

  getServiceName(): string {
    switch (this.selectedService) {
      case 1: return 'Corte';
      case 2: return 'Uñas';
      case 3: return 'Tinte';
      default: return 'Servicio';
    }
  }

  selectService(id: number): void {
    this.selectedService = this.selectedService === id ? null : id;
  }

  resetForm(): void {
    this.selectedClient = '';
    this.selectedEmployee = '';
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