import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  // url del backend (se cambia después)
  private apiUrl = 'http://TU_BACKEND_URL/api/clientes';

  constructor(private http: HttpClient) { }

  // crear cliente
  crearCliente(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ver todos los clientes
  obtenerClientes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ver cliente por id
  obtenerClientePorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // actualizar cliente
  actualizarCliente(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // eliminar cliente
  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}