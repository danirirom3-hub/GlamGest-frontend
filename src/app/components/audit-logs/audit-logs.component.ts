import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuditLog, AuditLogFilters, AuditLogsService } from '../../services/audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  readonly actions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'CREATE', label: 'Creaciones' },
    { value: 'UPDATE', label: 'Actualizaciones' },
    { value: 'DELETE', label: 'Desactivaciones o eliminaciones' },
    { value: 'ERROR', label: 'Errores' }
  ];
  readonly modules = [
    { value: '', label: 'Todos los módulos' },
    { value: 'appointments', label: 'Citas' },
    { value: 'backups', label: 'Backups' },
    { value: 'categories', label: 'Categorías' },
    { value: 'clients', label: 'Clientes' },
    { value: 'employees', label: 'Empleados' },
    { value: 'reports', label: 'Reportes' },
    { value: 'sales', label: 'Ventas' },
    { value: 'services', label: 'Servicios' },
    { value: 'users', label: 'Usuarios' }
  ];

  constructor(private auditLogsService: AuditLogsService) {}

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
        void Swal.fire('Logs', error?.error?.message || 'No se pudo cargar la auditoría.', 'error');
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
