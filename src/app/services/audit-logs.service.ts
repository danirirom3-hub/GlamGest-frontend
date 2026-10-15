import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLog {
  id: number;
  occurredAt: string;
  userId: number | null;
  userEmail: string | null;
  role: string | null;
  action: string;
  module: string;
  resourceId: string | null;
  httpMethod: string;
  endpoint: string;
  statusCode: number;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
}

export interface AuditLogPage {
  items: AuditLog[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditLogFilters {
  from?: string;
  to?: string;
  user?: string;
  action?: string;
  module?: string;
  status?: number;
  text?: string;
  page?: number;
  size?: number;
}

interface AuditLogResponse {
  data: AuditLogPage;
  status: number;
  successful: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {}

  search(filters: AuditLogFilters): Observable<AuditLogResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<AuditLogResponse>(this.apiUrl, { params });
  }
}
