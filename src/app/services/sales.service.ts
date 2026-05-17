import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SaleDetail {
  appointmentId?: number | null;
  employeeId: number;
  serviceId: number;
  quantity: number;
  unitPrice?: number;
}

export interface CreateSaleRequest {
  clientId: number;
  saleDetails: SaleDetail[];
  userId: number;
  paymentType: string;
}

export interface SaleResponse {
  data: any;
  message: string;
  status: number;
  successful: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  // URL base del backend tomada desde variables de entorno
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  // Crear venta
  createSale(data: CreateSaleRequest): Observable<SaleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<SaleResponse>(this.apiUrl, data, headers ? { headers } : {});
  }

  // Obtener todas las ventas
  getSales(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl, headers ? { headers } : {});
  }

  // Obtener venta por ID
  getSaleById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${id}`, headers ? { headers } : {});
  }

  // Actualizar venta
  updateSale(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}`, data, headers ? { headers } : {});
  }

  // Eliminar venta
  deleteSale(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, headers ? { headers } : {});
  }

}