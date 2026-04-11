import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  // url del backend (se cambia después)
  private apiUrl = 'http://TU_BACKEND_URL/api/ventas';

  constructor(private http: HttpClient) { }

  // crear venta
  crearVenta(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ver todas las ventas
  obtenerVentas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ver venta por id
  obtenerVentaPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // actualizar venta
  actualizarVenta(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // eliminar venta
  eliminarVenta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}