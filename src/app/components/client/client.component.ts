import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, User, LogOut } from 'lucide-angular';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../../services/clients.service';
import { AppointmentsService } from '../../services/appointments.service';
import { ServicesService } from '../../services/services.service';
import { EmployeesService } from '../../services/employees.service';

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
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
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
    private router: Router
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
        this.appointmentsError = this.getErrorMessage(error, 'No se pudieron cargar tus citas.');
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
        this.catalogError = this.getErrorMessage(error, 'No se pudieron cargar los servicios.');
        complete();
      },
      complete
    });
    this.employeesService.getEmployees().subscribe({
      next: response => this.employees = response?.data || response || [],
      error: error => {
        this.catalogError = this.catalogError || this.getErrorMessage(error, 'No se pudieron cargar los empleados.');
        complete();
      },
      complete
    });
  }

  saveAppointment(): void {
    if (!this.form.appointmentDatetime || !this.form.serviceId || !this.form.employeeId) {
      Swal.fire('Campos incompletos', 'Completa fecha, servicio y empleado.', 'warning');
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
        Swal.fire({ icon: 'success', title: editingId === null ? 'Cita agendada' : 'Cita actualizada', timer: 1200, showConfirmButton: false });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', this.getErrorMessage(error, 'No se pudo guardar la cita.'), 'error');
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
    Swal.fire({ title: '¿Cancelar cita?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No' }).then(result => {
      if (!result.isConfirmed) return;
      this.deletingId = appointment.id;
      this.appointmentsService.deleteAppointment(appointment.id).subscribe({
        next: () => { this.deletingId = null; this.loadAppointments(); Swal.fire('Cita cancelada', '', 'success'); },
        error: (error) => {
          this.deletingId = null;
          Swal.fire('Error', this.getErrorMessage(error, 'No se pudo cancelar la cita.'), 'error');
        }
      });
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = { appointmentDatetime: '', serviceId: '', employeeId: '', notes: '' };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getServiceName(id?: number): string {
    return this.services.find(service => service.id === id)?.name || `Servicio #${id || ''}`;
  }

  getEmployeeName(id?: number): string {
    return this.employees.find(employee => employee.id === id)?.name || `Empleado #${id || ''}`;
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (error?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (error?.status === 403) return 'No tienes permisos para realizar esta acción.';
    if (error?.error && typeof error.error === 'object') {
      const validationErrors = Object.values(error.error).filter(value => typeof value === 'string');
      if (validationErrors.length > 0) return validationErrors.join(' ');
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }
}
