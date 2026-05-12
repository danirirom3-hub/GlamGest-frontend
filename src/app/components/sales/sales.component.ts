import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {

  // Control de vistas
  view: 'create' | 'history' = 'create';

  // Control del modal
  showModal = false;

  // Datos del cliente
  clientData = {
    name: '',
    phone: '',
    email: ''
  };

  // Método de pago
  paymentMethod = '';

  // Clientes
  clients: any[] = [];

  // Servicios
  services: any[] = [];

  // Empleados
  employees: any[] = [];

  // Detalle de venta
  items: any[] = [];

  // Historial
  sales: any[] = [];

  // Abrir modal
  openModal() {

  }

  // Cerrar modal
  closeModal() {

  }

  // Agregar servicio
  addService(service: any) {

  }

  // Eliminar servicio
  removeService(index: number) {

  }

  // Calcular línea
  calculateLine(item: any) {

  }

  // Calcular total
  getTotal(): number {

    return 0;
  }

  // Registrar venta
  registrarVenta() {

  }

  // Limpiar formulario
  resetForm() {

  }

}