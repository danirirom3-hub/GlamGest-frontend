import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent {

  // =========================
  // 🧭 CONTROL DE VISTAS
  // =========================
  vista: 'registro' | 'agenda' = 'registro';

  // =========================
  // 💅 SERVICIO SELECCIONADO (VISUAL)
  // =========================
  servicioActivo: number | null = null;

  seleccionarServicio(id: number) {
    this.servicioActivo = this.servicioActivo === id ? null : id;
  }

  // =========================
  // ✅ MENSAJE CONFIRMACIÓN
  // =========================
  mostrarConfirmacion: boolean = false;

  agendarCita() {
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 3000);
  }

  // =========================
  // 📊 DETALLE / ESTADO (VISUAL)
  // =========================
  citaActiva: number | null = null;

  toggleCita(id: number) {
    this.citaActiva = this.citaActiva === id ? null : id;
  }

}