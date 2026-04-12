import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = 'http://192.168.1.9:8080/api/auth';
  private usersUrl = 'http://192.168.1.9:8080/api/users';

  constructor(private http: HttpClient) { }

  // Login del usuario
  login(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, data);
  }

  // Registro de usuario
  register(data: any): Observable<any> {
    return this.http.post(this.usersUrl, data);
  }

  // Guardar token en el navegador
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Obtener token guardado
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Cerrar sesión (borrar token)
  logout(): void {
    localStorage.removeItem('token');
  }

  // Verificar si el usuario está logueado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

}