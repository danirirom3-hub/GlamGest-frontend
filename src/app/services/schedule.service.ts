import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface BusinessHours {
  dayOfWeek: number;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface BusinessScheduleException {
  id: number;
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  reason: string | null;
}

export interface EmployeeUnavailability {
  id: number;
  employeeId: number;
  employeeName: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface EmployeeAvailableSlots {
  employeeId: number;
  employeeName: string;
  startsAt: string[];
}

export interface ScheduleAvailability {
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  durationMinutes: number;
  employees: EmployeeAvailableSlots[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
  successful: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly apiUrl = `${environment.apiUrl}/schedule`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private authOptions() {
    const token = this.authService.getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  getBusinessHours(): Observable<ApiResponse<BusinessHours[]>> {
    return this.http.get<ApiResponse<BusinessHours[]>>(`${this.apiUrl}/business-hours`, this.authOptions());
  }

  updateBusinessHours(hours: BusinessHours[]): Observable<ApiResponse<BusinessHours[]>> {
    return this.http.put<ApiResponse<BusinessHours[]>>(`${this.apiUrl}/business-hours`, hours, this.authOptions());
  }

  getExceptions(from: string, to: string): Observable<ApiResponse<BusinessScheduleException[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<BusinessScheduleException[]>>(`${this.apiUrl}/exceptions`, {
      ...this.authOptions(), params
    });
  }

  saveException(exception: Omit<BusinessScheduleException, 'id'>): Observable<ApiResponse<BusinessScheduleException>> {
    return this.http.put<ApiResponse<BusinessScheduleException>>(`${this.apiUrl}/exceptions`, exception, this.authOptions());
  }

  deleteException(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exceptions/${id}`, this.authOptions());
  }

  getEmployeeBlocks(from: string, to: string): Observable<ApiResponse<EmployeeUnavailability[]>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<EmployeeUnavailability[]>>(`${this.apiUrl}/employee-blocks`, {
      ...this.authOptions(), params
    });
  }

  createEmployeeBlock(block: Omit<EmployeeUnavailability, 'id' | 'employeeName'>): Observable<ApiResponse<EmployeeUnavailability>> {
    return this.http.post<ApiResponse<EmployeeUnavailability>>(`${this.apiUrl}/employee-blocks`, block, this.authOptions());
  }

  deleteEmployeeBlock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employee-blocks/${id}`, this.authOptions());
  }

  getAvailability(date: string, serviceIds: number[], ignoreAppointmentId?: number | null,
                  clientId?: number | null): Observable<ApiResponse<ScheduleAvailability>> {
    let params = new HttpParams().set('date', date);
    serviceIds.forEach(id => params = params.append('serviceIds', String(id)));
    if (ignoreAppointmentId !== undefined && ignoreAppointmentId !== null) {
      params = params.set('ignoreAppointmentId', String(ignoreAppointmentId));
    }
    if (clientId !== undefined && clientId !== null) params = params.set('clientId', String(clientId));
    return this.http.get<ApiResponse<ScheduleAvailability>>(`${this.apiUrl}/availability`, {
      ...this.authOptions(), params
    });
  }
}
