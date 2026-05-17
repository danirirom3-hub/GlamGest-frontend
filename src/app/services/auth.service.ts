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
    localStorage.removeItem('userId');
    localStorage.removeItem('user_id');
    localStorage.removeItem('id');
  }

  // Verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Obtener el ID del usuario actual desde localStorage o el token
  getUserId(): number | null {
    const storedUser =
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('id');

    if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
      const parsed = Number(storedUser);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }

    const userId =
      payload.id ||
      payload.userId ||
      payload.user_id ||
      payload.sub ||
      payload.user?.id ||
      payload.user?.userId ||
      payload.user?.user_id;

    const parsed = Number(userId);
    return isNaN(parsed) ? null : parsed;
  }

  private decodeJwtPayload(token: string): any {
    try {
      const payloadPart = token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch (error) {
      console.error('Error decoding token payload', error);
      return null;
    }
  }

}