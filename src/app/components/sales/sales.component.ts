import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientsService } from '../../services/clients.service';
import { SalesService } from '../../services/sales.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {

  constructor(
    private clientsService: ClientsService,
    private salesService: SalesService,
    private employeesService: EmployeesService,
    private servicesService: ServicesService
  ) {}

  // =========================
  // MENSAJES
  // =========================
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // =========================
  // VISTAS
  // =========================
  view: 'create' | 'history' = 'create';

  // =========================
  // MODAL
  // =========================
  showModal = false;

  // =========================
  // CLIENTE
  // =========================
  clientData = {
    name: '',
    phone: '',
    email: ''
  };

  selectedClientId: any = '';

  clients: any[] = [];

  // =========================
  // PAGO
  // =========================
  paymentMethod = '';

  // =========================
  // SERVICIOS
  // =========================
  services: any[] = [];

  // =========================
  // EMPLEADOS
  // =========================
  employees: any[] = [];

  // =========================
  // ITEMS
  // =========================
  items: any[] = [];

  // =========================
  // HISTORIAL
  // =========================
  sales: any[] = [];

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {

    this.loadClients();

    this.loadServices();

    this.loadEmployees();

    this.loadSales();

  }

  // =========================
  // CLIENTES
  // =========================
  loadClients(): void {

    this.clientsService.getClients().subscribe({

      next: (res: any) => {

        this.clients =
          res?.data || res || [];

        if (this.clients.length > 0) {

          this.selectedClientId =

            this.clients[0].client_id ??

            this.clients[0].id;

          this.onClientSelect();
        }
      },

      error: (err: any) => {

        console.error(
          'Error cargando clientes',
          err
        );
      }

    });
  }

  // =========================
  // SERVICIOS
  // =========================
  loadServices(): void {

    this.servicesService.getServices().subscribe({

      next: (res: any) => {

        this.services =
          res?.data || res || [];

      },

      error: (err: any) => {

        console.error(
          'Error cargando servicios',
          err
        );
      }

    });
  }

  // =========================
  // EMPLEADOS
  // =========================
  loadEmployees(): void {

    this.employeesService.getEmployees().subscribe({

      next: (res: any) => {

        this.employees =
          res?.data || res || [];

      },

      error: (err: any) => {

        console.error(
          'Error cargando empleados',
          err
        );
      }

    });
  }

  // =========================
  // HISTORIAL
  // =========================
  loadSales(): void {

    this.salesService.getSales().subscribe({

      next: (res: any) => {

        this.sales =
          res?.data || res || [];

      },

      error: (err: any) => {

        console.error(
          'Error cargando ventas',
          err
        );
      }

    });
  }

  // =========================
  // SELECCIONAR CLIENTE
  // =========================
  onClientSelect(): void {

    const client = this.clients.find(

      c =>

        (c.client_id ?? c.id) ==

        this.selectedClientId

    );

    if (client) {

      this.clientData.name =
        client.name || '';

      this.clientData.phone =
        client.phone || '';

      this.clientData.email =
        client.email || '';

    } else {

      this.clientData = {

        name: '',

        phone: '',

        email: ''

      };
    }
  }

  // =========================
  // MODAL
  // =========================
  openModal(): void {

    this.showModal = true;

  }

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
  // ELIMINAR ITEM
  // =========================
  removeService(index: number): void {

    this.items.splice(index, 1);

  }

  // =========================
  // CALCULAR SUBTOTAL
  // =========================
  calculateLine(item: any): void {

    const quantity =
      Number(item.quantity) || 0;

    const unitPrice =
      Number(item.unitPrice) || 0;

    item.subtotal =
      quantity * unitPrice;

  }

  // =========================
  // TOTAL
  // =========================
  getTotal(): number {

    return this.items.reduce(

      (sum, item) =>

        sum + (

          Number(item.subtotal) || 0

        ),

      0

    );
  }

  // =========================
  // REGISTRAR VENTA
  // =========================
  registrarVenta(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // =========================
    // VALIDAR CLIENTE
    // =========================

    const matchedClient =
      this.clients.find(

        c =>

          (c.client_id ?? c.id) ==

          this.selectedClientId

      );

    if (!matchedClient) {

      this.errorMessage =
        'Debe seleccionar un cliente válido';

      return;
    }

    // =========================
    // VALIDAR MÉTODO PAGO
    // =========================

    if (!this.paymentMethod) {

      this.errorMessage =
        'Seleccione un método de pago';

      return;
    }

    // =========================
    // VALIDAR ITEMS
    // =========================

    if (this.items.length === 0) {

      this.errorMessage =
        'Debe agregar al menos un servicio';

      return;
    }

    // =========================
    // VALIDAR EMPLEADOS
    // =========================

    const missingEmployee =
      this.items.some(

        item => !item.employeeId

      );

    if (missingEmployee) {

      this.errorMessage =
        'Debe asignar un empleado a cada servicio';

      return;
    }

    // =========================
    // USER ID
    // =========================
    // TEMPORAL
    // CAMBIA EL 2
    // POR TU ID REAL

    const userId = 2;

    // =========================
    // DETALLES
    // =========================

    const saleDetails =
      this.items.map(item => ({

        appointmentId:
          item.appointmentId || null,

        employeeId:
          Number(item.employeeId),

        serviceId:
          Number(item.serviceId),

        quantity:
          Number(item.quantity) || 1,

        unitPrice:
          Number(item.unitPrice) || 0

      }));

    // =========================
    // PAYLOAD
    // =========================

    const payload = {

      clientId:
        Number(
          matchedClient.client_id ??
          matchedClient.id
        ),

      userId: Number(userId),

      paymentType:
        this.paymentMethod.toLowerCase(),

      saleDetails

    };

    console.log(
      'PAYLOAD VENTA:',
      payload
    );

    // =========================
    // CREAR VENTA
    // =========================

    this.isLoading = true;

    this.salesService.createSale(payload)
      .subscribe({

        next: (res: any) => {

          console.log(
            'VENTA CREADA:',
            res
          );

          this.isLoading = false;

          this.successMessage =

            res?.message ||

            'Venta creada correctamente';

          this.resetForm();

          this.loadSales();

        },

        error: (err: any) => {

          console.error(
            'ERROR CREANDO VENTA:',
            err
          );

          this.isLoading = false;

          this.errorMessage =

            err?.error?.message ||

            'Error al registrar la venta';
        }

      });
  }

  // =========================
  // LIMPIAR
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

        this.clients[0].client_id ??

        this.clients[0].id;

      this.onClientSelect();
    }
  }

}