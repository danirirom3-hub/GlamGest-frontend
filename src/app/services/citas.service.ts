import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  // aquí va la url del backend cuando esté listo
  private apiUrl = 'http://TU_BACKEND_URL/api/citas';

  constructor(private http: HttpClient) { }

  // crear cita
  crearCita(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ver todas las citas
  obtenerCitas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ver una cita por id
  obtenerCitaPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // actualizar cita
  actualizarCita(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // eliminar cita
  eliminarCita(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}