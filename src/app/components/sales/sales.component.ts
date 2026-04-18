import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {

  // Control de vista (crear o historial)
  view: 'create' | 'history' = 'create';

  // Servicio seleccionado (visual)
  selectedService: number | null = null;

  selectService(id: number) {
    this.selectedService = this.selectedService === id ? null : id;
  }

  // Venta activa para mostrar detalle
  activeSale: number | null = null;

  toggleDetail(id: number) {
    this.activeSale = this.activeSale === id ? null : id;
  }

}