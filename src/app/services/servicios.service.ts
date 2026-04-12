import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private apiUrl = 'http://192.168.1.9:8080/api/services';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // crear servicio (ej: corte, manicure, etc)
  crearServicio(data: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post(this.apiUrl, data, { headers });
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