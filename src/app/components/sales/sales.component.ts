import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ClientsService } from '../../services/clients.service';
import { SalesService } from '../../services/sales.service';
import { EmployeesService } from '../../services/employees.service';
import { ServicesService } from '../../services/services.service';
import { AppointmentsService } from '../../services/appointments.service';
import { LanguageService } from '../../services/language.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {

  constructor(
    private clientsService: ClientsService,
    private salesService: SalesService,
    private employeesService: EmployeesService,
    private servicesService: ServicesService,
    private appointmentsService: AppointmentsService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  formatCurrency(value: number): string {
    const locale = this.languageService.currentLanguage === 'en' ? 'en-US' : 'es-CO';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  private showError(key: string): void {
    Swal.fire({
      icon: 'error',
      title: this.translate.instant('common.error'),
      text: this.translate.instant(key)
    });
  }

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

        this.showError('sales.loadClientsError');

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

        this.showError('sales.loadServicesError');

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

        this.showError('sales.loadEmployeesError');

      }

    });

  }

  loadSales(): void {

    this.salesService.getSales().subscribe({

      next: (res: any) => {

        const data = res?.data || res || [];

        this.sales = data.map((sale: any) => ({

          ...sale,

          showDetails: false,

          saleDetails:

            sale.saleDetails ||

            sale.details ||

            []

        }));

      },

      error: (err: any) => {

        console.error(err);

        this.showError('sales.loadSalesError');

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

        this.showError('sales.loadAppointmentsError');

      }

    });

  }

  toggleSaleDetails(sale: any): void {

    sale.showDetails = !sale.showDetails;

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

      this.translate.instant('sales.clientFallback')

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

      this.translate.instant('sales.serviceFallback')

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

      this.translate.instant('sales.employeeFallback')

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

      s =>
        (s.service_id ?? s.id) == id

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
      s =>
        (s.service_id ?? s.id) == serviceId
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

    Swal.fire({
      icon: 'success',
      title: this.translate.instant('sales.selectedTitle'),
      text: this.translate.instant('sales.selectedText'),
      timer: 1800,
      showConfirmButton: false
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

    Swal.fire({
      icon: 'success',
      title: this.translate.instant('sales.serviceAddedTitle'),
      text: this.translate.instant('sales.serviceAddedText', { name: service.name }),
      timer: 1800,
      showConfirmButton: false
    });

    this.closeModal();

  }

  removeService(index: number): void {

    Swal.fire({
      title: this.translate.instant('sales.removeTitle'),
      text: this.translate.instant('sales.removeText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesDelete'),
      cancelButtonText: this.translate.instant('common.cancel')
    }).then((result) => {

      if (result.isConfirmed) {

        this.items.splice(index, 1);

        Swal.fire({
          icon: 'success',
          title: this.translate.instant('sales.removedTitle'),
          text: this.translate.instant('sales.removedText'),
          timer: 1800,
          showConfirmButton: false
        });

      }

    });

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

      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('sales.clientRequiredTitle'),
        text: this.translate.instant('sales.clientRequiredText')
      });

      return;

    }

    if (!this.paymentMethod) {

      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('sales.paymentRequiredTitle'),
        text: this.translate.instant('sales.paymentRequiredText')
      });

      return;

    }

    if (this.items.length === 0) {

      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('sales.servicesRequiredTitle'),
        text: this.translate.instant('sales.servicesRequiredText')
      });

      return;

    }

    const missingEmployee =
      this.items.some(
        item => !item.employeeId
      );

    if (missingEmployee) {

      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('sales.employeeRequiredTitle'),
        text: this.translate.instant('sales.employeeRequiredText')
      });

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

    Swal.fire({
      title: this.translate.instant('sales.confirmTitle'),
      text: this.translate.instant('sales.confirmText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesRegister'),
      cancelButtonText: this.translate.instant('common.cancel')
    }).then((result) => {

      if (result.isConfirmed) {

        this.isLoading = true;

        this.salesService.createSale(payload)
          .subscribe({

            next: () => {

              this.successMessage =
                this.translate.instant('sales.successMessage');

              this.isLoading = false;

              Swal.fire({
                icon: 'success',
                title: this.translate.instant('sales.registeredTitle'),
                text: this.translate.instant('sales.registeredText'),
                confirmButtonText: this.translate.instant('common.accept')
              });

              this.resetForm();

              this.loadSales();

            },

            error: (err: any) => {

              this.errorMessage =

                err?.error?.message ||

                this.translate.instant('sales.error');

              this.isLoading = false;

              Swal.fire({
                icon: 'error',
                title: this.translate.instant('common.error'),
                text: this.errorMessage
              });

            }

          });

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