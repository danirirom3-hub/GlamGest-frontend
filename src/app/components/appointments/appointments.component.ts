import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent {

  // Controla qué vista se muestra (registro o agenda)
  view: 'create' | 'list' = 'create';

  // Guarda el servicio seleccionado
  selectedService: number | null = null;

  selectService(id: number) {
    this.selectedService = this.selectedService === id ? null : id;
  }

  // Muestra el mensaje cuando se agenda una cita
  showConfirmation: boolean = false;

  scheduleAppointment() {
    this.showConfirmation = true;

    setTimeout(() => {
      this.showConfirmation = false;
    }, 3000);
  }

  // Control visual de la cita activa (para expandir o resaltar)
  activeAppointment: number | null = null;

  toggleAppointment(id: number) {
    this.activeAppointment = this.activeAppointment === id ? null : id;
  }

}