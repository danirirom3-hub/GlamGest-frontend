import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  // URL base del backend tomada desde variables de entorno
  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }

  // Crear cliente
  createClient(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Obtener todos los clientes
  getClients(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Obtener cliente por ID
  getClientById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Actualizar cliente
  updateClient(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar cliente
  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}