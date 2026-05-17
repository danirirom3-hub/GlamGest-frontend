import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {

  constructor(private clientsService: ClientsService) {}

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

  // Cliente seleccionado
  selectedClientId: any = '';

  // Servicios
  services: any[] = [];

  // Empleados
  employees: any[] = [];

  // Detalle de venta
  items: any[] = [];

  // Historial
  sales: any[] = [];

  ngOnInit(): void {
    this.loadClients();
  }

  // =========================
  // CARGAR CLIENTES
  // =========================
  loadClients(): void {

    this.clientsService.getClients().subscribe({

      next: (res: any) => {

        // Compatible con res.data o arreglo directo
        this.clients = res?.data || res || [];

        // Seleccionar automáticamente el primero
        if (this.clients.length > 0) {

          this.selectedClientId =
            this.clients[0].client_id ?? this.clients[0].id;

          this.onClientSelect();
        }
      },

      error: (err: any) => {
        console.error('Error cargando clientes', err);
      }

    });
  }

  // =========================
  // SELECCIONAR CLIENTE
  // =========================
  onClientSelect(): void {

    const client = this.clients.find(
      c => (c.client_id ?? c.id) == this.selectedClientId
    );

    if (client) {

      this.clientData.name = client.name || '';
      this.clientData.phone = client.phone || '';
      this.clientData.email = client.email || '';

    } else {

      this.clientData = {
        name: '',
        phone: '',
        email: ''
      };
    }
  }

  // =========================
  // ABRIR MODAL
  // =========================
  openModal(): void {
    this.showModal = true;
  }

  // =========================
  // CERRAR MODAL
  // =========================
  closeModal(): void {
    this.showModal = false;
  }

  // =========================
  // AGREGAR SERVICIO
  // =========================
  addService(service: any): void {

    this.items.push({
      serviceId: service.id,
      serviceName: service.name,
      employeeId: '',
      employeeName: '',
      quantity: 1,
      unitPrice: service.price || 0,
      subtotal: service.price || 0
    });

    this.calculateLine(
      this.items[this.items.length - 1]
    );

    this.closeModal();
  }

  // =========================
  // ELIMINAR SERVICIO
  // =========================
  removeService(index: number): void {
    this.items.splice(index, 1);
  }

  // =========================
  // CALCULAR SUBTOTAL
  // =========================
  calculateLine(item: any): void {

    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;

    item.subtotal = quantity * unitPrice;
  }

  // =========================
  // CALCULAR TOTAL
  // =========================
  getTotal(): number {

    return this.items.reduce(
      (sum, item) => sum + (Number(item.subtotal) || 0),
      0
    );
  }

  // =========================
  // REGISTRAR VENTA
  // =========================
  registrarVenta(): void {

    const sale = {

      client: {
        ...this.clientData
      },

      paymentMethod: this.paymentMethod,

      items: this.items,

      total: this.getTotal(),

      date: new Date()
    };

    this.sales.push(sale);

    console.log('Venta registrada:', sale);

    alert('Venta registrada correctamente');

    this.resetForm();
  }

  // =========================
  // LIMPIAR FORMULARIO
  // =========================
  resetForm(): void {

    this.clientData = {
      name: '',
      phone: '',
      email: ''
    };

    this.paymentMethod = '';

    this.items = [];

    if (this.clients.length > 0) {

      this.selectedClientId =
        this.clients[0].client_id ?? this.clients[0].id;

      this.onClientSelect();
    }
  }

}