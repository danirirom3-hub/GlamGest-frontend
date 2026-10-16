import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditLog, AuditLogFilters, AuditLogsService } from '../../services/audit-logs.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  page = 0;
  size = 50;
  totalItems = 0;
  totalPages = 0;
  filters: AuditLogFilters = { from: '', to: '', user: '', action: '', module: '', status: undefined, text: '' };

  get actions(): { value: string; label: string }[] {
    return [
      { value: '', label: this.translate.instant('auditLogs.actions.empty') },
      { value: 'CREATE', label: this.translate.instant('auditLogs.actions.create') },
      { value: 'UPDATE', label: this.translate.instant('auditLogs.actions.update') },
      { value: 'DELETE', label: this.translate.instant('auditLogs.actions.delete') },
      { value: 'ERROR', label: this.translate.instant('auditLogs.actions.error') }
    ];
  }

  get modules(): { value: string; label: string }[] {
    return [
      { value: '', label: this.translate.instant('auditLogs.modules.empty') },
      { value: 'appointments', label: this.translate.instant('auditLogs.modules.appointments') },
      { value: 'backups', label: this.translate.instant('auditLogs.modules.backups') },
      { value: 'categories', label: this.translate.instant('auditLogs.modules.categories') },
      { value: 'clients', label: this.translate.instant('auditLogs.modules.clients') },
      { value: 'employees', label: this.translate.instant('auditLogs.modules.employees') },
      { value: 'reports', label: this.translate.instant('auditLogs.modules.reports') },
      { value: 'sales', label: this.translate.instant('auditLogs.modules.sales') },
      { value: 'services', label: this.translate.instant('auditLogs.modules.services') },
      { value: 'users', label: this.translate.instant('auditLogs.modules.users') }
    ];
  }

  constructor(private auditLogsService: AuditLogsService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditLogsService.search({ ...this.filters, page: this.page, size: this.size }).subscribe({
      next: response => {
        this.logs = response.data.items;
        this.totalItems = response.data.totalItems;
        this.totalPages = response.data.totalPages;
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        void Swal.fire(this.translate.instant('auditLogs.title'), error?.error?.message || this.translate.instant('auditLogs.loadError'), 'error');
      }
    });
  }

  search(): void {
    this.page = 0;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filters = { from: '', to: '', user: '', action: '', module: '', status: undefined, text: '' };
    this.search();
  }

  previousPage(): void {
    if (this.page === 0) return;
    this.page--;
    this.loadLogs();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.loadLogs();
  }

  statusClass(status: number): string {
    if (status >= 500) return 'status-error';
    if (status >= 400) return 'status-warning';
    return 'status-success';
  }
}
