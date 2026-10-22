import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { EmployeesService } from '../../services/employees.service';
import { ApiErrorMapper } from '../../services/api-error.mapper';
import {
  BusinessHours,
  BusinessScheduleException,
  EmployeeUnavailability,
  ScheduleService
} from '../../services/schedule.service';

interface EmployeeOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-schedule-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './schedule-settings.component.html',
  styleUrls: ['./schedule-settings.component.css']
})
export class ScheduleSettingsComponent implements OnInit {
  businessHours: BusinessHours[] = [];
  exceptions: BusinessScheduleException[] = [];
  employeeBlocks: EmployeeUnavailability[] = [];
  employees: EmployeeOption[] = [];
  loading = true;
  savingHours = false;
  savingException = false;
  savingEmployeeBlock = false;
  errorMessage = '';

  exceptionForm = { date: '', closed: true, opensAt: '09:00', closesAt: '19:00', reason: '' };
  employeeBlockForm = { employeeId: '', startsAt: '', endsAt: '', reason: '' };

  private readonly dayKeys: Record<number, string> = {
    1: 'schedule.days.monday',
    2: 'schedule.days.tuesday',
    3: 'schedule.days.wednesday',
    4: 'schedule.days.thursday',
    5: 'schedule.days.friday',
    6: 'schedule.days.saturday',
    7: 'schedule.days.sunday'
  };

  constructor(
    private scheduleService: ScheduleService,
    private employeesService: EmployeesService,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  dayLabel(dayOfWeek: number): string {
    return this.translate.instant(this.dayKeys[dayOfWeek] || 'common.unknown');
  }

  loadSettings(): void {
    this.loading = true;
    this.errorMessage = '';
    const today = this.toInputDate(new Date());
    const until = this.toInputDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    this.scheduleService.getBusinessHours().subscribe({
      next: response => this.businessHours = response?.data || [],
      error: error => this.errorMessage = this.errorMapper.resolve(error, this.translate.instant('schedule.loadError')),
      complete: () => this.loading = false
    });
    this.scheduleService.getExceptions(today, until).subscribe({
      next: response => this.exceptions = response?.data || [],
      error: error => this.errorMessage = this.errorMapper.resolve(error, this.translate.instant('schedule.loadError'))
    });
    this.scheduleService.getEmployeeBlocks(`${today}T00:00:00`, `${until}T23:59:59`).subscribe({
      next: response => this.employeeBlocks = response?.data || [],
      error: error => this.errorMessage = this.errorMapper.resolve(error, this.translate.instant('schedule.loadError'))
    });
    this.employeesService.getEmployees().subscribe({
      next: (response: any) => this.employees = (response?.data || response || []).map((employee: any) => ({
        id: employee.id ?? employee.employee_id,
        name: employee.name
      })),
      error: error => this.errorMessage = this.errorMapper.resolve(error, this.translate.instant('schedule.loadError'))
    });
  }

  saveBusinessHours(): void {
    if (this.savingHours || this.businessHours.length !== 7) return;
    this.savingHours = true;
    this.scheduleService.updateBusinessHours(this.businessHours).subscribe({
      next: response => {
        this.businessHours = response?.data || this.businessHours;
        void Swal.fire(this.translate.instant('schedule.savedTitle'), this.translate.instant('schedule.savedText'), 'success');
      },
      error: error => {
        void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('schedule.saveError')), 'error');
      },
      complete: () => this.savingHours = false
    });
  }

  saveException(): void {
    if (this.savingException || !this.exceptionForm.date) return;
    this.savingException = true;
    const { date, closed, opensAt, closesAt, reason } = this.exceptionForm;
    this.scheduleService.saveException({
      date,
      closed,
      opensAt: closed ? null : opensAt,
      closesAt: closed ? null : closesAt,
      reason: reason.trim() || null
    }).subscribe({
      next: response => {
        if (response?.data) {
          this.exceptions = [
            ...this.exceptions.filter(item => item.date !== response.data.date),
            response.data
          ].sort((first, second) => first.date.localeCompare(second.date));
        }
        this.exceptionForm = { date: '', closed: true, opensAt: '09:00', closesAt: '19:00', reason: '' };
        void Swal.fire(this.translate.instant('schedule.savedTitle'), this.translate.instant('schedule.exceptionSaved'), 'success');
      },
      error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('schedule.exceptionError')), 'error'),
      complete: () => this.savingException = false
    });
  }

  deleteException(exception: BusinessScheduleException): void {
    Swal.fire({
      title: this.translate.instant('schedule.deleteExceptionTitle'),
      text: exception.date,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.delete'),
      cancelButtonText: this.translate.instant('common.cancel')
    }).then(result => {
      if (!result.isConfirmed) return;
      this.scheduleService.deleteException(exception.id).subscribe({
        next: () => this.exceptions = this.exceptions.filter(item => item.id !== exception.id),
        error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('schedule.exceptionError')), 'error')
      });
    });
  }

  saveEmployeeBlock(): void {
    if (this.savingEmployeeBlock || !this.employeeBlockForm.employeeId
        || !this.employeeBlockForm.startsAt || !this.employeeBlockForm.endsAt) return;
    this.savingEmployeeBlock = true;
    const form = this.employeeBlockForm;
    this.scheduleService.createEmployeeBlock({
      employeeId: Number(form.employeeId),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      reason: form.reason.trim() || null
    }).subscribe({
      next: response => {
        if (response?.data) {
          this.employeeBlocks = [...this.employeeBlocks, response.data]
            .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
        }
        this.employeeBlockForm = { employeeId: '', startsAt: '', endsAt: '', reason: '' };
        void Swal.fire(this.translate.instant('schedule.savedTitle'), this.translate.instant('schedule.employeeBlockSaved'), 'success');
      },
      error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('schedule.employeeBlockError')), 'error'),
      complete: () => this.savingEmployeeBlock = false
    });
  }

  deleteEmployeeBlock(block: EmployeeUnavailability): void {
    Swal.fire({
      title: this.translate.instant('schedule.deleteEmployeeBlockTitle'),
      text: `${block.employeeName} · ${this.formatDateTime(block.startsAt)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.delete'),
      cancelButtonText: this.translate.instant('common.cancel')
    }).then(result => {
      if (!result.isConfirmed) return;
      this.scheduleService.deleteEmployeeBlock(block.id).subscribe({
        next: () => this.employeeBlocks = this.employeeBlocks.filter(item => item.id !== block.id),
        error: error => void Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(error, this.translate.instant('schedule.employeeBlockError')), 'error')
      });
    });
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(this.translate.currentLang === 'en' ? 'en-US' : 'es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private toInputDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }
}
