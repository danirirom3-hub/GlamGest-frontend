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
  // MENSAJES Y ESTADOS
  // =========================
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // =========================
  // CONTROL DE VISTAS
  // =========================
  view: 'create' | 'history' = 'create';

  // =========================
  // MODAL
  // =========================
  showModal = false;

  // =========================
  // DATOS CLIENTE
  // =========================
  clientData = {
    name: '',
    phone: '',
    email: ''
  };

  // =========================
  // MÉTODO DE PAGO
  // =========================
  paymentMethod = '';

  // =========================
  // CLIENTES
  // =========================
  clients: any[] = [];

  selectedClientId: any = '';

  // =========================
  // SERVICIOS
  // =========================
  services: any[] = [];

  // =========================
  // EMPLEADOS
  // =========================
  employees: any[] = [];

  // =========================
  // ITEMS VENTA
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
  // CARGAR CLIENTES
  // =========================
  loadClients(): void {

    this.clientsService.getClients().subscribe({

      next: (res: any) => {

        this.clients = res?.data || res || [];

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
  // CARGAR SERVICIOS
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
  // CARGAR EMPLEADOS
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
  // CARGAR HISTORIAL
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
  // CALCULAR LÍNEA
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
      this.clients.find(c =>

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
    // OBTENER USER ID
    // =========================

    let userId: number | null = null;

    // Buscar en localStorage
    const storedUser =

      localStorage.getItem('userId') ||

      localStorage.getItem('user_id') ||

      localStorage.getItem('id');

    if (storedUser) {

      userId = Number(storedUser);

    }

    // Buscar en token
    if (!userId) {

      const token =
        localStorage.getItem('token');

      if (token) {

        try {

          const payload = JSON.parse(

            atob(
              token.split('.')[1]
            )

          );

          console.log(
            'TOKEN PAYLOAD:',
            payload
          );

          userId = Number(

            payload.id ||

            payload.userId ||

            payload.user_id ||

            payload.sub

          );

        } catch (e) {

          console.error(
            'Error leyendo token',
            e
          );
        }
      }
    }

    // Validación final
    if (!userId || isNaN(userId)) {

      this.errorMessage =
        'No se encontró el usuario logueado';

      return;
    }

    // =========================
    // CONSTRUIR DETALLES
    // =========================

    const saleDetails =
      this.items.map(item => ({

        appointmentId:
          item.appointmentId || null,

        employeeId:
          item.employeeId,

        serviceId:
          item.serviceId,

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
        matchedClient.client_id ??
        matchedClient.id,

      userId,

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

          this.isLoading = false;

          this.successMessage =
            res?.message ||
            'Venta creada correctamente';

          this.resetForm();

          this.loadSales();

        },

        error: (err: any) => {

          this.isLoading = false;

          console.error(
            'ERROR CREANDO VENTA',
            err
          );

          this.errorMessage =

            err?.error?.message ||

            'Error al registrar la venta';
        }

      });
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

        this.clients[0].client_id ??

        this.clients[0].id;

      this.onClientSelect();
    }
  }

}