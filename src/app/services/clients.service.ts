import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  // Crea un cliente nuevo.
  createClient(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl, data, { headers });
  }

  // Obtiene el perfil del cliente autenticado.
  getMyProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/me`, { headers });
  }

  getClients(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl, { headers });
  }

  // Obtiene un cliente por su identificador.
  getClientById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }

  // Actualiza los datos de un cliente.
  updateClient(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  // Desactiva un cliente.
  deleteClient(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

}
