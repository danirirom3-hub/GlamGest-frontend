import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientsService } from '../../services/clients.service';
import { SalesService } from '../../services/sales.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';
import { AppointmentsService } from '../../services/appointments.service';

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
    private servicesService: ServicesService,
    private appointmentsService: AppointmentsService
  ) {}

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  view: 'create' | 'history' = 'create';

  showModal = false;
  showAppointmentsModal = false;

  appointmentSearch = '';

  selectedClientId: any = '';

  paymentMethod = '';

  clients: any[] = [];
  services: any[] = [];
  employees: any[] = [];
  sales: any[] = [];
  appointments: any[] = [];
  items: any[] = [];

  selectedAppointment: any = null;

  clientData = {
    name: '',
    phone: '',
    email: ''
  };

  ngOnInit(): void {

    this.loadClients();
    this.loadServices();
    this.loadEmployees();
    this.loadSales();
    this.loadAppointments();

  }

  loadClients(): void {

    this.clientsService.getClients().subscribe({

      next: (res: any) => {

        this.clients = res?.data || res || [];

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  loadServices(): void {

    this.servicesService.getServices().subscribe({

      next: (res: any) => {

        this.services = res?.data || res || [];

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  loadEmployees(): void {

    this.employeesService.getEmployees().subscribe({

      next: (res: any) => {

        this.employees = res?.data || res || [];

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  loadSales(): void {

    this.salesService.getSales().subscribe({

      next: (res: any) => {

        this.sales = res?.data || res || [];

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  loadAppointments(): void {

    this.appointmentsService.getAppointments().subscribe({

      next: (res: any) => {

        const data = res?.data || res || [];

        this.appointments = data.filter(
          (a: any) => a.status !== 'FACTURADA'
        );

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  onClientSelect(): void {

    const client = this.clients.find(

      c =>
        (c.client_id ?? c.id) ==
        this.selectedClientId

    );

    if (client) {

      this.clientData = {

        name: client.name || '',
        phone: client.phone || '',
        email: client.email || ''

      };

    }

  }

  openModal(): void {

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

  }

  openAppointmentsModal(): void {

    this.showAppointmentsModal = true;

  }

  closeAppointmentsModal(): void {

    this.showAppointmentsModal = false;

  }

  filteredAppointments(): any[] {

    if (!this.appointmentSearch) {

      return this.appointments;

    }

    return this.appointments.filter((a: any) =>

      this.getAppointmentClientName(a)
        .toLowerCase()
        .includes(
          this.appointmentSearch.toLowerCase()
        )

    );

  }

  getAppointmentClientName(
    appointment: any
  ): string {

    return (

      appointment.client?.name ||

      appointment.clientName ||

      this.findClientName(
        appointment.clientId
      ) ||

      'Cliente'

    );

  }

  getAppointmentServiceName(
    appointment: any
  ): string {

    return (

      appointment.service?.name ||

      appointment.serviceName ||

      this.findServiceName(
        appointment.serviceId
      ) ||

      'Servicio'

    );

  }

  getAppointmentEmployeeName(
    appointment: any
  ): string {

    return (

      appointment.employee?.name ||

      appointment.employeeName ||

      this.findEmployeeName(
        appointment.employeeId
      ) ||

      'Empleado'

    );

  }

  findClientName(id: any): string {

    const client = this.clients.find(

      c =>
        (c.client_id ?? c.id) == id

    );

    return client?.name || '';

  }

  findServiceName(id: any): string {

    const service = this.services.find(

      s => s.id == id

    );

    return service?.name || '';

  }

  findEmployeeName(id: any): string {

    const employee = this.employees.find(

      e =>
        (e.employee_id ?? e.id) == id

    );

    return employee?.name || '';

  }

  getEmployeeName(id: any): string {

    return this.findEmployeeName(id);

  }

  selectAppointment(
    appointment: any
  ): void {

    this.selectedAppointment =
      appointment;

    this.selectedClientId =

      appointment.clientId ||

      appointment.client?.id ||

      appointment.client?.client_id ||

      '';

    this.onClientSelect();

    this.items = [];

    const serviceId =
      appointment.serviceId ||
      appointment.service?.id;

    const employeeId =
      appointment.employeeId ||
      appointment.employee?.id;

    const service = this.services.find(
      s => s.id == serviceId
    );

    const price =
      service?.price || 0;

    this.items.push({

      appointmentId:
        appointment.id,

      serviceId,

      serviceName:
        this.getAppointmentServiceName(
          appointment
        ),

      employeeId,

      quantity: 1,

      unitPrice: price,

      subtotal: price

    });

    this.closeAppointmentsModal();

  }

  addService(service: any): void {

    this.items.push({

      serviceId: service.id,

      serviceName: service.name,

      employeeId: '',

      quantity: 1,

      unitPrice: service.price || 0,

      subtotal: service.price || 0

    });

    this.closeModal();

  }

  removeService(index: number): void {

    this.items.splice(index, 1);

  }

  calculateLine(item: any): void {

    item.subtotal =

      (Number(item.quantity) || 0) *

      (Number(item.unitPrice) || 0);

  }

  getTotal(): number {

    return this.items.reduce(

      (sum, item) =>

        sum + (
          Number(item.subtotal) || 0
        ),

      0

    );

  }

  registrarVenta(): void {

    this.errorMessage = '';
    this.successMessage = '';

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

    if (!this.paymentMethod) {

      this.errorMessage =
        'Seleccione un método de pago';

      return;

    }

    if (this.items.length === 0) {

      this.errorMessage =
        'Debe agregar al menos un servicio';

      return;

    }

    const missingEmployee =
      this.items.some(
        item => !item.employeeId
      );

    if (missingEmployee) {

      this.errorMessage =
        'Debe asignar un empleado';

      return;

    }

    const saleDetails =
      this.items.map(item => ({

        appointmentId:
          item.appointmentId || null,

        employeeId:
          Number(item.employeeId),

        serviceId:
          Number(item.serviceId),

        quantity:
          Number(item.quantity),

        unitPrice:
          Number(item.unitPrice)

      }));

    const payload = {

      clientId:
        Number(
          matchedClient.client_id ??
          matchedClient.id
        ),

      userId: 2,

      paymentType:
        this.paymentMethod.toLowerCase(),

      saleDetails

    };

    this.isLoading = true;

    this.salesService.createSale(payload)
      .subscribe({

        next: () => {

          this.successMessage =
            'Venta creada correctamente';

          this.isLoading = false;

          this.resetForm();

          this.loadSales();

        },

        error: (err: any) => {

          this.errorMessage =

            err?.error?.message ||

            'Error al registrar venta';

          this.isLoading = false;

        }

      });

  }

  deleteSale(sale: any): void {

    this.salesService.deleteSale(sale.id)
      .subscribe({

        next: () => {

          this.sales = this.sales.filter(
            s => s.id !== sale.id
          );

        },

        error: (err: any) => {

          console.error(err);

        }

      });

  }

  resetForm(): void {

    this.paymentMethod = '';

    this.items = [];

    this.selectedAppointment = null;

    this.selectedClientId = '';

  }

}