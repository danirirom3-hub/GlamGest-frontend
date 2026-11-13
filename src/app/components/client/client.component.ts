import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, User, LogOut, Settings, LayoutGrid, History, Clock } from 'lucide-angular';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../../services/clients.service';
import { AppointmentsService } from '../../services/appointments.service';
import { ServicesService } from '../../services/services.service';
import { EmployeesService } from '../../services/employees.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ApiErrorMapper } from '../../services/api-error.mapper';
import { AppearanceSettingsComponent } from '../settings/appearance-settings.component';
import { ScheduleAvailability, ScheduleService } from '../../services/schedule.service';
import { CategoriesService, Category } from '../../services/categories.service';

interface ClientAppointment {
  id: number;
  appointmentDatetime: string;
  clientId?: number;
  serviceId?: number;
  employeeId?: number;
  notes?: string;
  status?: string;
  billed?: boolean;
}

interface CatalogOption {
  id: number;
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  categoryId?: number | null;
  categoryName?: string;
}

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TranslateModule, LocalizedDatePipe, AppearanceSettingsComponent],
  templateUrl: './client.component.html',
  styleUrls: ['../dashboard/dashboard.component.css', './client.component.css']
})
export class ClientComponent implements OnInit {
  icons = { Calendar, User, LogOut, Settings, LayoutGrid, History, Clock };
  readonly sections = ['catalog', 'booking', 'upcoming', 'history', 'profile'] as const;
  activeSection: typeof this.sections[number] = 'catalog';
  isSettingsPage = false;
  profile: any = null;
  appointments: ClientAppointment[] = [];
  services: CatalogOption[] = [];
  categories: Category[] = [];
  selectedCatalogCategoryId: number | null = null;
  employees: CatalogOption[] = [];
  availability: ScheduleAvailability | null = null;
  isLoadingAvailability = false;
  isLoading = false;
  isLoadingAppointments = true;
  isLoadingCatalog = true;
  appointmentsError = '';
  catalogError = '';
  deletingId: number | null = null;
  editingId: number | null = null;
  form = { appointmentDate: '', appointmentTime: '', serviceIds: [] as number[], employeeId: '', notes: '' };
  private availabilityRequestId = 0;

  constructor(
    private authService: AuthService,
    private clientsService: ClientsService,
    private appointmentsService: AppointmentsService,
    private servicesService: ServicesService,
    private employeesService: EmployeesService,
    private categoriesService: CategoriesService,
    private scheduleService: ScheduleService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) {}

  ngOnInit(): void {
    this.isSettingsPage = this.route.snapshot.data['clientSettings'] === true;
    const requestedSection = this.route.snapshot.queryParamMap.get('section');
    if (requestedSection && this.sections.includes(requestedSection as typeof this.sections[number])) {
      this.activeSection = requestedSection as typeof this.sections[number];
    }
    if (!this.isSettingsPage) {
      this.loadProfile();
      this.loadAppointments();
      this.loadCatalog();
      this.loadCategories();
    }
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
      next: response => this.services = (response?.data || response || []).map((service: any) => ({
        id: service.id ?? service.service_id,
        name: service.name,
        description: service.description ?? '',
        durationMinutes: service.durationMinutes ?? service.duration_minutes ?? 15,
        price: service.price ?? 0,
        categoryId: service.categoryId ?? service.category_id ?? null,
        categoryName: service.categoryName ?? service.category_name ?? ''
      })),
      error: error => {
        this.catalogError = this.getErrorMessage(error, this.translate.instant('portal.loadServicesError'));
        complete();
      },
      complete
    });
    this.employeesService.getEmployees().subscribe({
      next: response => this.employees = (response?.data || response || []).map((employee: any) => ({
        id: employee.id ?? employee.employee_id,
        name: employee.name
      })),
      error: error => {
        this.catalogError = this.catalogError || this.getErrorMessage(error, this.translate.instant('portal.loadEmployeesError'));
        complete();
      },
      complete
    });
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: response => this.categories = (response?.data || []).filter(category => category.active !== false),
      error: () => this.categories = []
    });
  }

  setSection(section: typeof this.sections[number]): void {
    if (this.isSettingsPage) {
      void this.router.navigate(['/client'], { queryParams: { section } });
      return;
    }
    this.activeSection = section;
    if (section === 'booking' && !this.form.appointmentDate) this.resetForm();
  }

  reserveService(service: CatalogOption): void {
    this.form = { ...this.form, serviceIds: [service.id], employeeId: '', appointmentTime: '' };
    this.activeSection = 'booking';
    this.refreshAvailability();
  }

  get upcomingAppointments(): ClientAppointment[] {
    return this.appointments
      .filter(appointment => !this.isHistoryAppointment(appointment))
      .sort((a, b) => new Date(a.appointmentDatetime).getTime() - new Date(b.appointmentDatetime).getTime());
  }

  get filteredCatalogServices(): CatalogOption[] {
    return this.services.filter(service =>
      this.selectedCatalogCategoryId === null || service.categoryId === this.selectedCatalogCategoryId
    );
  }

  get historyAppointments(): ClientAppointment[] {
    return this.appointments
      .filter(appointment => this.isHistoryAppointment(appointment))
      .sort((a, b) => new Date(b.appointmentDatetime).getTime() - new Date(a.appointmentDatetime).getTime());
  }

  isHistoryAppointment(appointment: ClientAppointment): boolean {
    const status = String(appointment.status || '').toUpperCase();
    return Boolean(appointment.billed)
      || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)
      || new Date(appointment.appointmentDatetime).getTime() < Date.now();
  }

  categoryName(service: CatalogOption): string {
    return service.categoryName
      || this.categories.find(category => category.id === service.categoryId)?.name
      || this.translate.instant('portal.generalCategory');
  }

  formatPrice(value?: number): string {
    return new Intl.NumberFormat(this.translate.currentLang === 'en' ? 'en-US' : 'es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  statusLabel(status?: string): string {
    const normalized = String(status || 'PENDING').toUpperCase();
    const key = `portal.status.${normalized}`;
    const translated = this.translate.instant(key);
    return translated === key ? normalized : translated;
  }

  saveAppointment(): void {
    if (!this.form.appointmentDate || !this.form.appointmentTime || !this.form.serviceIds.length || !this.form.employeeId) {
      Swal.fire(this.translate.instant('common.error'), this.translate.instant('portal.incomplete'), 'warning');
      return;
    }

    const appointmentDatetime = `${this.form.appointmentDate}T${this.form.appointmentTime}:00`;
    const editingId = this.editingId;
    if (editingId !== null) {
      if (this.form.serviceIds.length !== 1) {
        Swal.fire(this.translate.instant('common.error'), this.translate.instant('portal.editSingleService'), 'warning');
        return;
      }
      const appointment = this.appointments.find(item => item.id === editingId);
      const clientId = appointment?.clientId ?? this.authService.getClientId() ?? this.profile?.id ?? this.profile?.clientId;
      const payload: any = {
        appointmentDatetime,
        serviceId: this.form.serviceIds[0],
        employeeId: Number(this.form.employeeId),
        notes: this.form.notes
      };
      if (clientId !== undefined && clientId !== null) payload.clientId = Number(clientId);
      this.submitAppointmentUpdate(editingId, payload);
      return;
    }

    const payload = {
      appointmentDatetime,
      employeeId: Number(this.form.employeeId),
      serviceIds: this.form.serviceIds,
      notes: this.form.notes
    };
    this.isLoading = true;
    this.appointmentsService.createAppointmentsBatch(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetForm();
        this.loadAppointments();
        Swal.fire({ icon: 'success', title: this.translate.instant('portal.createdTitle'), timer: 1200, showConfirmButton: false });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire(this.translate.instant('common.error'), this.getErrorMessage(error, this.translate.instant('portal.saveError')), 'error');
      }
    });
  }

  private submitAppointmentUpdate(id: number, payload: any): void {
    this.isLoading = true;
    this.appointmentsService.updateAppointment(id, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetForm();
        this.loadAppointments();
        Swal.fire({ icon: 'success', title: this.translate.instant('portal.updatedTitle'), timer: 1200, showConfirmButton: false });
      },
      error: error => {
        this.isLoading = false;
        Swal.fire(this.translate.instant('common.error'), this.getErrorMessage(error, this.translate.instant('portal.saveError')), 'error');
      }
    });
  }

  editAppointment(appointment: ClientAppointment): void {
    this.editingId = appointment.id;
    const parts = this.dateTimeParts(appointment.appointmentDatetime);
    this.form = {
      appointmentDate: parts.date,
      appointmentTime: parts.time,
      serviceIds: appointment.serviceId ? [appointment.serviceId] : [],
      employeeId: String(appointment.employeeId || ''),
      notes: appointment.notes || ''
    };
    this.refreshAvailability();
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
    this.form = { appointmentDate: '', appointmentTime: '', serviceIds: [], employeeId: '', notes: '' };
    this.availability = null;
    this.isLoadingAvailability = false;
  }

  toggleService(serviceId: number): void {
    if (this.editingId !== null && this.form.serviceIds.includes(serviceId)) return;
    this.form.serviceIds = this.form.serviceIds.includes(serviceId)
      ? this.form.serviceIds.filter(id => id !== serviceId)
      : [...this.form.serviceIds, serviceId];
    this.form.employeeId = '';
    this.form.appointmentTime = '';
    this.refreshAvailability();
  }

  isServiceSelected(serviceId: number): boolean {
    return this.form.serviceIds.includes(serviceId);
  }

  onAppointmentDateChange(date: string): void {
    this.form.appointmentDate = date;
    this.form.appointmentTime = '';
    this.refreshAvailability();
  }

  onEmployeeChange(employeeId: string): void {
    this.form.employeeId = employeeId;
    this.form.appointmentTime = '';
  }

  get availableEmployees(): Array<{ employeeId: number; employeeName: string; startsAt: string[] }> {
    return this.availability?.employees.filter(employee => employee.startsAt.length > 0) || [];
  }

  get availableTimes(): string[] {
    return this.availability?.employees.find(employee => employee.employeeId === Number(this.form.employeeId))
      ?.startsAt.map(time => time.slice(0, 5)) || [];
  }

  get availabilityEmployees(): Array<{ employeeId: number; employeeName: string; startsAt: string[] }> {
    return this.availability?.employees || [];
  }

  get availabilityTimeSlots(): string[] {
    if (!this.availability?.opensAt || !this.availability.closesAt) return [];
    const slots: string[] = [];
    const [openHour, openMinute] = this.availability.opensAt.slice(0, 5).split(':').map(Number);
    const [closeHour, closeMinute] = this.availability.closesAt.slice(0, 5).split(':').map(Number);
    const first = openHour * 60 + openMinute;
    const last = closeHour * 60 + closeMinute - this.availability.durationMinutes;
    for (let minutes = first; minutes <= last; minutes += 15) {
      slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    }
    return slots;
  }

  isSlotAvailable(employeeId: number, time: string): boolean {
    return Boolean(this.availability?.employees
      .find(employee => employee.employeeId === employeeId)
      ?.startsAt.some(start => start.slice(0, 5) === time));
  }

  selectAvailableSlot(employeeId: number, time: string): void {
    if (!this.isSlotAvailable(employeeId, time)) return;
    this.form.employeeId = String(employeeId);
    this.form.appointmentTime = time;
  }

  private refreshAvailability(): void {
    const requestId = ++this.availabilityRequestId;
    if (!this.form.appointmentDate || !this.form.serviceIds.length) {
      this.availability = null;
      this.isLoadingAvailability = false;
      return;
    }
    this.isLoadingAvailability = true;
    this.scheduleService.getAvailability(this.form.appointmentDate, this.form.serviceIds, this.editingId,
      this.authService.getClientId()).subscribe({
      next: response => {
        if (requestId !== this.availabilityRequestId) return;
        this.availability = response?.data || null;
        if (!this.availableEmployees.some(employee => employee.employeeId === Number(this.form.employeeId))) {
          this.form.employeeId = '';
          this.form.appointmentTime = '';
        }
        this.isLoadingAvailability = false;
      },
      error: () => {
        if (requestId !== this.availabilityRequestId) return;
        this.availability = null;
        this.isLoadingAvailability = false;
      }
    });
  }

  private dateTimeParts(value: string): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(value));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { date: `${values['year']}-${values['month']}-${values['day']}`, time: `${values['hour']}:${values['minute']}` };
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
    return this.errorMapper.resolve(error, fallback);
  }
}
