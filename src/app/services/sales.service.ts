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
  userId?: number;
  user_id?: number;
  paymentType: string;
}

export interface SaleResponse {
  data: any;
  message: string;
  status: number;
  successful: boolean;
}

export interface CashierAppointment {
  appointmentId: number;
  appointmentDatetime: string;
  status: string;
  serviceId: number;
  serviceName: string;
  scheduledEmployeeId: number;
  scheduledEmployeeName: string;
  durationMinutes: number;
  defaultPrice: number;
}

export interface CashierGroup {
  clientId: number;
  clientName: string;
  businessDate: string;
  appointments: CashierAppointment[];
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  // URL base de los endpoints de ventas.
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  // Crea una venta con sus detalles.
  createSale(data: CreateSaleRequest): Observable<SaleResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<SaleResponse>(this.apiUrl, data, headers ? { headers } : {});
  }

  // Obtiene el listado de ventas.
  getSales(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl, headers ? { headers } : {});
  }

  // Obtiene una venta por su identificador.
  getSaleById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${id}`, headers ? { headers } : {});
  }

  getCashierGroup(appointmentId: number): Observable<SaleResponse & { data: CashierGroup }> {
    const headers = this.getAuthHeaders();
    return this.http.get<SaleResponse & { data: CashierGroup }>(
      `${this.apiUrl}/cashier-group`,
      { ...(headers ? { headers } : {}), params: { appointmentId } }
    );
  }

  // Actualiza los datos permitidos de una venta.
  updateSale(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}`, data, headers ? { headers } : {});
  }

  // Anula una venta.
  deleteSale(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, headers ? { headers } : {});
  }

}
