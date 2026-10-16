import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, User, LogOut } from 'lucide-angular';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../../services/clients.service';
import { AppointmentsService } from '../../services/appointments.service';
import { ServicesService } from '../../services/services.service';
import { EmployeesService } from '../../services/employees.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

interface ClientAppointment {
  id: number;
  appointmentDatetime: string;
  clientId?: number;
  serviceId?: number;
  employeeId?: number;
  notes?: string;
  status?: string;
}

interface CatalogOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './client.component.html',
  styleUrls: ['../dashboard/dashboard.component.css', './client.component.css']
})
export class ClientComponent implements OnInit {
  icons = { Calendar, User, LogOut };
  profile: any = null;
  appointments: ClientAppointment[] = [];
  services: CatalogOption[] = [];
  employees: CatalogOption[] = [];
  isLoading = false;
  isLoadingAppointments = true;
  isLoadingCatalog = true;
  appointmentsError = '';
  catalogError = '';
  deletingId: number | null = null;
  editingId: number | null = null;
  form = { appointmentDatetime: '', serviceId: '', employeeId: '', notes: '' };

  constructor(
    private authService: AuthService,
    private clientsService: ClientsService,
    private appointmentsService: AppointmentsService,
    private servicesService: ServicesService,
    private employeesService: EmployeesService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAppointments();
    this.loadCatalog();
  }

  loadProfile(): void {
    this.clientsService.getMyProfile().subscribe({
      next: (response) => this.profile = response?.data || response,
      error: () => this.profile = null
    });
  }

  loadAppointments(): void {
    this.isLoadingAppointments = true;
    this.appointmentsError = '';
    this.appointmentsService.getMyAppointments().subscribe({
      next: (response) => {
        this.appointments = response?.data || response || [];
        this.isLoadingAppointments = false;
      },
      error: (error) => {
        this.isLoadingAppointments = false;
        this.appointmentsError = this.getErrorMessage(error, this.translate.instant('portal.loadAppointmentsError'));
      }
    });
  }

  loadCatalog(): void {
    this.isLoadingCatalog = true;
    this.catalogError = '';
    let pendingRequests = 2;
    const complete = () => {
      pendingRequests -= 1;
      if (pendingRequests === 0) this.isLoadingCatalog = false;
    };

    this.servicesService.getServices().subscribe({
      next: response => this.services = response?.data || response || [],
      error: error => {
        this.catalogError = this.getErrorMessage(error, this.translate.instant('portal.loadServicesError'));
        complete();
      },
      complete
    });
    this.employeesService.getEmployees().subscribe({
      next: response => this.employees = response?.data || response || [],
      error: error => {
        this.catalogError = this.catalogError || this.getErrorMessage(error, this.translate.instant('portal.loadEmployeesError'));
        complete();
      },
      complete
    });
  }

  saveAppointment(): void {
    if (!this.form.appointmentDatetime || !this.form.serviceId || !this.form.employeeId) {
      Swal.fire(this.translate.instant('common.error'), this.translate.instant('portal.incomplete'), 'warning');
      return;
    }

    const payload: any = {
      appointmentDatetime: this.form.appointmentDatetime,
      serviceId: Number(this.form.serviceId),
      employeeId: Number(this.form.employeeId),
      notes: this.form.notes
    };
    const editingId = this.editingId;
    if (editingId !== null) {
      const appointment = this.appointments.find(item => item.id === editingId);
      const clientId = appointment?.clientId ?? this.authService.getClientId() ?? this.profile?.id ?? this.profile?.clientId;
      if (clientId !== undefined && clientId !== null) payload.clientId = Number(clientId);
    }
    this.isLoading = true;
    const request = editingId === null
      ? this.appointmentsService.createAppointment(payload)
      : this.appointmentsService.updateAppointment(editingId, payload);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.resetForm();
        this.loadAppointments();
        Swal.fire({ icon: 'success', title: this.translate.instant(editingId === null ? 'portal.createdTitle' : 'portal.updatedTitle'), timer: 1200, showConfirmButton: false });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire(this.translate.instant('common.error'), this.getErrorMessage(error, this.translate.instant('portal.saveError')), 'error');
      }
    });
  }

  editAppointment(appointment: ClientAppointment): void {
    this.editingId = appointment.id;
    this.form = {
      appointmentDatetime: appointment.appointmentDatetime?.slice(0, 16) || '',
      serviceId: String(appointment.serviceId || ''),
      employeeId: String(appointment.employeeId || ''),
      notes: appointment.notes || ''
    };
  }

  cancelAppointment(appointment: ClientAppointment): void {
    Swal.fire({ title: this.translate.instant('portal.cancelTitle'), icon: 'warning', showCancelButton: true, confirmButtonText: this.translate.instant('portal.cancelConfirm'), cancelButtonText: this.translate.instant('common.no') }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingId = appointment.id;
      this.appointmentsService.deleteAppointment(appointment.id).subscribe({
        next: () => { this.deletingId = null; this.loadAppointments(); Swal.fire(this.translate.instant('portal.cancelled'), '', 'success'); },
        error: (error) => {
          this.deletingId = null;
          Swal.fire(this.translate.instant('common.error'), this.getErrorMessage(error, this.translate.instant('portal.cancelError')), 'error');
        }
      });
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = { appointmentDatetime: '', serviceId: '', employeeId: '', notes: '' };
  }

  logout(): void {
    this.authService.logoutRemote().subscribe({
      error: () => this.router.navigate(['/login']),
      complete: () => this.router.navigate(['/login'])
    });
  }

  getServiceName(id?: number): string {
    return this.services.find(service => service.id === id)?.name || this.translate.instant('portal.serviceFallback', { id: id || '' });
  }

  getEmployeeName(id?: number): string {
    return this.employees.find(employee => employee.id === id)?.name || this.translate.instant('portal.employeeFallback', { id: id || '' });
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (error?.status === 401) return this.translate.instant('portal.sessionExpired');
    if (error?.status === 403) return this.translate.instant('portal.forbidden');
    if (error?.error && typeof error.error === 'object') {
      const validationErrors = Object.values(error.error).filter(value => typeof value === 'string');
      if (validationErrors.length > 0) return validationErrors.join(' ');
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }
}
