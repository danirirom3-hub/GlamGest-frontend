import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  // url del backend (se cambia después)
  private apiUrl = 'http://TU_BACKEND_URL/api/servicios';

  constructor(private http: HttpClient) { }

  // crear servicio (ej: corte, manicure, etc)
  crearServicio(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ver todos los servicios
  obtenerServicios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ver servicio por id
  obtenerServicioPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // actualizar servicio
  actualizarServicio(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // eliminar servicio
  eliminarServicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}