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

  // Control de vista
  view: 'create' | 'history' = 'create';

  // Datos (vendrán del backend)
  sales: any[] = [];
  clients: any[] = [];
  services: any[] = [];
  employees: any[] = [];

  // Servicios seleccionados (estructura tipo sale_details)
  selectedServices: any[] = [];

  // UI
  activeSale: number | null = null;

  // Agregar servicio
  addService(service: any) {
    this.selectedServices.push(service);
  }

  // Eliminar servicio
  removeService(index: number) {
    this.selectedServices.splice(index, 1);
  }

  // Mostrar detalle
  toggleDetail(id: number) {
    this.activeSale = this.activeSale === id ? null : id;
  }

}