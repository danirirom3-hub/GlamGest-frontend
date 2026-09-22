import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ServicePayload {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  categoryId: number | null;
}

export interface ServiceItem extends ServicePayload {
  id: number;
  active: boolean;
  categoryName?: string | null;
}

export interface ServicesResponse<T> {
  data: T;
  status: number;
  successful: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  // URL base del backend tomada desde variables de entorno
  private apiUrl = `${environment.apiUrl}/services`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener headers con token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Crear servicio (ej: corte, manicure, etc.)
  createService(data: ServicePayload): Observable<ServicesResponse<ServiceItem>> {
    return this.http.post<ServicesResponse<ServiceItem>>(this.apiUrl, data, {
      headers: this.getAuthHeaders()
    });
  }

  // Obtener todos los servicios
  getServices(): Observable<ServicesResponse<ServiceItem[]>> {
    return this.http.get<ServicesResponse<ServiceItem[]>>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // Obtener servicio por ID
  getServiceById(id: number): Observable<ServicesResponse<ServiceItem>> {
    return this.http.get<ServicesResponse<ServiceItem>>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Actualizar servicio
  updateService(id: number, data: ServicePayload): Observable<ServicesResponse<ServiceItem>> {
    return this.http.put<ServicesResponse<ServiceItem>>(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  // Eliminar servicio
  deleteService(id: number): Observable<ServicesResponse<void>> {
    return this.http.delete<ServicesResponse<void>>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

}
