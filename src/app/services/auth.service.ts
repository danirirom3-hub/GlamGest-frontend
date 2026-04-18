import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // URL base tomada desde variables de entorno
  private authUrl = `${environment.apiUrl}/auth`;
  private usersUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  // Iniciar sesión del usuario
  login(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, data);
  }

  // Registrar nuevo usuario
  register(data: any): Observable<any> {
    return this.http.post(this.usersUrl, data);
  }

  // Guardar token en el almacenamiento local del navegador
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Obtener token almacenado
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Cerrar sesión eliminando el token
  logout(): void {
    localStorage.removeItem('token');
  }

  // Verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

}