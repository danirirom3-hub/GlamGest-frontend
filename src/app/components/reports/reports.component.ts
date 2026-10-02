import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, BarChart3, CalendarDays, Download, FileSpreadsheet, FileText, Wifi, WifiOff, RefreshCw } from 'lucide-angular';
import { Observable } from 'rxjs';
import { OfflineStoreService, StoredReport } from '../../services/offline-store.service';
import { DownloadedReport, ReportDefinition, reportCacheKey, ReportsService } from '../../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  readonly icons = { BarChart3, CalendarDays, Download, FileSpreadsheet, FileText, Wifi, WifiOff, RefreshCw };
  readonly reports: ReportDefinition[] = [
    { type: 'executive', format: 'pdf', title: 'Resumen ejecutivo', description: 'Una vista general del rendimiento del negocio.', fallbackName: 'resumen-ejecutivo.pdf' },
    { type: 'appointments', format: 'pdf', title: 'Reporte de citas', description: 'Detalle de citas y estados del período.', fallbackName: 'reporte-citas.pdf' },
    { type: 'sales', format: 'excel', title: 'Detalle de ventas', description: 'Información detallada de las ventas registradas.', fallbackName: 'detalle-ventas.xlsx' },
    { type: 'services', format: 'excel', title: 'Servicios más vendidos', description: 'Servicios ordenados por desempeño comercial.', fallbackName: 'servicios-mas-vendidos.xlsx' },
    { type: 'employees', format: 'excel', title: 'Rendimiento de empleados', description: 'Resultados del equipo durante el período.', fallbackName: 'rendimiento-empleados.xlsx' }
  ];
  from = '';
  to = '';
  loading: string | null = null;
  errorMessage = '';
  lastSync = '';
  online$: Observable<boolean> = this.offlineStore.online$;
  cachedReports: Record<string, StoredReport | undefined> = {};

  constructor(private reportsService: ReportsService, private offlineStore: OfflineStoreService) {}

  async ngOnInit(): Promise<void> {
    const period = await this.offlineStore.getLastPeriod().catch(() => undefined);
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    this.from = period?.from || this.toDateInput(first);
    this.to = period?.to || this.toDateInput(today);
    await this.refreshCachedReports();
  }

  applyPeriod(): void {
    this.errorMessage = this.validatePeriod();
    if (!this.errorMessage) {
      void this.offlineStore.saveLastPeriod(this.from, this.to);
      void this.refreshCachedReports();
    }
  }

  download(definition: ReportDefinition): void {
    this.errorMessage = this.validatePeriod();
    if (this.errorMessage || this.loading) return;
    this.loading = definition.type;
    this.reportsService.download(definition, this.from, this.to).subscribe({
      next: report => {
        this.saveBlob(report);
        const key = reportCacheKey(definition, this.from, this.to);
        this.cachedReports[key] = {
          key,
          type: report.type,
          format: report.format,
          from: report.from,
          to: report.to,
          blob: report.blob,
          fileName: report.fileName,
          contentType: report.contentType,
          syncedAt: report.syncedAt
        };
        this.lastSync = report.syncedAt;
        this.loading = null;
      },
      error: error => {
        this.loading = null;
        this.errorMessage = this.errorFor(error);
      }
    });
  }

  cacheKey(definition: ReportDefinition): string {
    return reportCacheKey(definition, this.from, this.to);
  }

  cachedReport(definition: ReportDefinition): StoredReport | undefined {
    return this.cachedReports[this.cacheKey(definition)];
  }

  private async refreshCachedReports(): Promise<void> {
    const stored = await this.offlineStore.listReports().catch(() => []);
    this.cachedReports = {};
    stored.forEach(report => {
      if (report.type && report.format && report.from && report.to) {
        this.cachedReports[reportCacheKey(report, report.from, report.to)] = report;
      }
    });
  }

  private saveBlob(report: DownloadedReport): void {
    const url = URL.createObjectURL(report.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = report.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private validatePeriod(): string {
    if (!this.from || !this.to) return 'Selecciona una fecha inicial y una fecha final.';
    if (this.to < this.from) return 'La fecha final no puede ser anterior a la fecha inicial.';
    return '';
  }

  private errorFor(error: any): string {
    if (error?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (error?.status === 403) return 'No tienes permisos para descargar este reporte.';
    if (error?.status === 404) return 'El reporte solicitado no está disponible.';
    return error?.message || 'No se pudo descargar el reporte. Revisa tu conexión e inténtalo nuevamente.';
  }

  private toDateInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
}
