import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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

  appointments: any[] = [];

  // filtros
  filterClient = '';
  filterEmployee = '';
  filterDate = '';

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: []
  };

  selectService(id: number) {
    this.selectedService = this.selectedService === id ? null : id;
  }

  scheduleAppointment() {

    if (!this.selectedClient || !this.selectedEmployee || !this.selectedDate || !this.selectedTime) {
      return;
    }

    const newAppointment = {
      client: this.selectedClient,
      employee: this.selectedEmployee,
      service: this.getServiceName(),
      date: this.selectedDate,
      time: this.selectedTime,
      status: 'active'
    };

    this.appointments.push(newAppointment);

    this.calendarOptions.events = [
      ...this.calendarOptions.events,
      {
        title: `${newAppointment.client} - ${newAppointment.service} (${newAppointment.employee})`,
        date: newAppointment.date
      }
    ];

    this.showConfirmation = true;
    setTimeout(() => this.showConfirmation = false, 2500);

    this.resetForm();
  }

  resetForm() {
    this.selectedClient = '';
    this.selectedEmployee = '';
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedService = null;
  }

  getServiceName(): string {
    switch (this.selectedService) {
      case 1: return 'Corte';
      case 2: return 'Uñas';
      case 3: return 'Tinte';
      default: return 'Servicio';
    }
  }

  filteredAppointments() {
    return this.appointments.filter(a =>
      (!this.filterClient || a.client.toLowerCase().includes(this.filterClient.toLowerCase())) &&
      (!this.filterEmployee || a.employee.toLowerCase().includes(this.filterEmployee.toLowerCase())) &&
      (!this.filterDate || a.date === this.filterDate)
    );
  }
}