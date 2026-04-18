import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  // URL base del backend tomada desde variables de entorno
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) { }

  // Crear venta
  createSale(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Obtener todas las ventas
  getSales(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Obtener venta por ID
  getSaleById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Actualizar venta
  updateSale(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar venta
  deleteSale(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}