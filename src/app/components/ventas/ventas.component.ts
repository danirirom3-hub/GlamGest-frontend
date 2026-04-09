import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent {

  // =========================
  // 🧭 CONTROL DE VISTAS
  // =========================
  vista: 'registro' | 'historial' = 'registro';

  // =========================
  // 💅 SERVICIOS (VISUAL)
  // =========================
  servicioActivo: number | null = null;

  seleccionarServicio(id: number) {
    this.servicioActivo = this.servicioActivo === id ? null : id;
  }

  // =========================
  // 📊 HISTORIAL (DETALLE)
  // =========================
  ventaActiva: number | null = null;

  toggleDetalle(id: number) {
    this.ventaActiva = this.ventaActiva === id ? null : id;
  }

}