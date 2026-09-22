import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LucideAngularModule, BarChart3, CalendarDays, RefreshCw, TrendingUp, Users, ShoppingBag, Receipt } from 'lucide-angular';
import {
  AppointmentStatusMetric,
  DashboardMetricsService,
  DashboardSummary,
  EmployeeMetric,
  RevenueMetric,
  ServiceMetric
} from '../../services/dashboard-metrics.service';

type DatePreset = 'today' | 'week' | 'month' | 'custom';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.css']
})
export class MetricsComponent implements OnInit {
  readonly icons = { BarChart3, CalendarDays, RefreshCw, TrendingUp, Users, ShoppingBag, Receipt };
  readonly statusLabels: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada',
    CANCELLED: 'Cancelada', NO_SHOW: 'No asistió'
  };

  preset: DatePreset = 'month';
  from = '';
  to = '';
  customFrom = '';
  customTo = '';
  loading = false;
  errorMessage = '';
  hasLoaded = false;
  summary: DashboardSummary | null = null;
  revenue: RevenueMetric[] = [];
  appointments: AppointmentStatusMetric[] = [];
  services: ServiceMetric[] = [];
  employees: EmployeeMetric[] = [];

  constructor(private metricsService: DashboardMetricsService) {}

  ngOnInit(): void {
    this.selectPreset('month');
  }

  selectPreset(preset: DatePreset): void {
    this.preset = preset;
    if (preset === 'custom') return;
    const today = new Date();
    const start = new Date(today);
    if (preset === 'week') start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    if (preset === 'month') start.setDate(1);
    this.from = this.toDateInput(start);
    this.to = this.toDateInput(today);
    this.loadMetrics();
  }

  applyCustomRange(): void {
    if (!this.customFrom || !this.customTo || this.customFrom > this.customTo) return;
    this.from = this.customFrom;
    this.to = this.customTo;
    this.loadMetrics();
  }

  loadMetrics(): void {
    if (!this.from || !this.to) return;
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      summary: this.metricsService.getSummary(this.from, this.to),
      revenue: this.metricsService.getRevenue(this.from, this.to),
      appointments: this.metricsService.getAppointments(this.from, this.to),
      services: this.metricsService.getServices(this.from, this.to),
      employees: this.metricsService.getEmployees(this.from, this.to)
    }).subscribe({
      next: (result) => {
        this.summary = result.summary?.data ?? null;
        this.revenue = result.revenue?.data ?? [];
        this.appointments = result.appointments?.data ?? [];
        this.services = [...(result.services?.data ?? [])].sort((a, b) => b.revenue - a.revenue || b.units - a.units);
        this.employees = result.employees?.data ?? [];
        this.hasLoaded = true;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.hasLoaded = true;
        this.errorMessage = error?.error?.message || 'No se pudieron cargar las métricas. Intenta nuevamente.';
      }
    });
  }

  formatCurrency(value = 0): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(value);
  }

  statusName(label: string): string { return this.statusLabels[label] || label; }

  statusPercent(value: number): number {
    const total = this.appointments.reduce((sum, item) => sum + item.value, 0);
    return total ? (value / total) * 100 : 0;
  }

  get maxRevenue(): number { return Math.max(...this.revenue.map(item => item.revenue), 1); }

  get revenuePoints(): string {
    if (!this.revenue.length) return '';
    const width = 640; const height = 210;
    return this.revenue.map((item, index) => {
      const x = this.revenue.length === 1 ? width / 2 : index * width / (this.revenue.length - 1);
      const y = height - (item.revenue / this.maxRevenue) * (height - 20);
      return `${x},${y}`;
    }).join(' ');
  }

  trackByLabel(_: number, item: AppointmentStatusMetric): string { return item.label; }
  trackByService(_: number, item: ServiceMetric): number { return item.serviceId; }
  trackByEmployee(_: number, item: EmployeeMetric): number { return item.employeeId; }

  private toDateInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
}
