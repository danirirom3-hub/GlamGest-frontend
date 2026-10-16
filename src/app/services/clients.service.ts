import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  registrationDate?: string;
}

export interface ClientPage {
  items: Client[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface ClientApiResponse<T> {
  data: T;
  status: number;
  successful: boolean;
  message: string;
}

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
  createClient(data: Client): Observable<ClientApiResponse<Client>> {
    const headers = this.getAuthHeaders();
    return this.http.post<ClientApiResponse<Client>>(this.apiUrl, data, { headers });
  }

  // Obtiene el perfil del cliente autenticado.
  getMyProfile(): Observable<ClientApiResponse<Client>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClientApiResponse<Client>>(`${this.apiUrl}/me`, { headers });
  }

  getClients(search = '', sort = 'recent', page = 0, size = 25): Observable<ClientApiResponse<ClientPage>> {
    const headers = this.getAuthHeaders();
    const params = { search, sort, page, size };
    return this.http.get<ClientApiResponse<ClientPage>>(this.apiUrl, { headers, params });
  }

  // Obtiene un cliente por su identificador.
  getClientById(id: number): Observable<ClientApiResponse<Client>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ClientApiResponse<Client>>(`${this.apiUrl}/${id}`, { headers });
  }

  // Actualiza los datos de un cliente.
  updateClient(id: number, data: Client): Observable<ClientApiResponse<Client>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ClientApiResponse<Client>>(`${this.apiUrl}/${id}`, data, { headers });
  }

  // Desactiva un cliente.
  deleteClient(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

}
