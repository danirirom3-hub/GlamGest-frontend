import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
  data: T;
  status: number;
  successful: boolean;
  message: string;
}

export interface AppointmentStatusMetric {
  label: string;
  value: number;
}

export interface DashboardSummary {
  from: string;
  to: string;
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
  newClients: number;
  totalAppointments: number;
  appointmentsByStatus: AppointmentStatusMetric[];
}

export interface RevenueMetric {
  date: string;
  sales: number;
  revenue: number;
}

export interface ServiceMetric {
  serviceId: number;
  serviceName: string;
  units: number;
  revenue: number;
}

export interface EmployeeMetric {
  employeeId: number;
  employeeName: string;
  appointments: number;
  revenue: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardMetricsService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getSummary(from: string, to: string): Observable<ApiResponse<DashboardSummary>> {
    return this.get<ApiResponse<DashboardSummary>>('summary', from, to);
  }

  getRevenue(from: string, to: string): Observable<ApiResponse<RevenueMetric[]>> {
    return this.get<ApiResponse<RevenueMetric[]>>('revenue', from, to);
  }

  getAppointments(from: string, to: string): Observable<ApiResponse<AppointmentStatusMetric[]>> {
    return this.get<ApiResponse<AppointmentStatusMetric[]>>('appointments', from, to);
  }

  getServices(from: string, to: string): Observable<ApiResponse<ServiceMetric[]>> {
    return this.get<ApiResponse<ServiceMetric[]>>('services', from, to);
  }

  getEmployees(from: string, to: string): Observable<ApiResponse<EmployeeMetric[]>> {
    return this.get<ApiResponse<EmployeeMetric[]>>('employees', from, to);
  }

  private get<T>(resource: string, from: string, to: string): Observable<T> {
    const params = new HttpParams().set('from', from).set('to', to);
    const token = this.authService.getToken();
    const options = token
      ? { params, headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : { params };
    return this.http.get<T>(`${this.apiUrl}/${resource}`, options);
  }
}
