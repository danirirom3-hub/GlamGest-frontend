import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PrivacyPolicy {
  version: string;
  effectiveDate: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // URL base tomada desde variables de entorno
  private authUrl = `${environment.apiUrl}/auth`;
  private policyPendingSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('privacyPolicyPending') === 'true'
  );

  constructor(private http: HttpClient) { }

  // Iniciar sesión del usuario
  login(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, data);
  }

  // Registrar nuevo usuario
  register(data: any): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  getPrivacyPolicy(): Observable<{ data: PrivacyPolicy; status: number; successful: boolean; message: string }> {
    return this.http.get<{ data: PrivacyPolicy; status: number; successful: boolean; message: string }>(
      `${this.authUrl}/policy`
    );
  }

  acceptPrivacyPolicy(): Observable<any> {
    return this.http.put(`${this.authUrl}/policy`, { accepted: true }).pipe(
      tap(() => this.setPolicyPending(false))
    );
  }

  saveSession(response: any): void {
    const session = response?.data || response;
    if (session?.token) this.saveToken(session.token);
    if (session?.role) localStorage.setItem('role', session.role);
    if (session?.userId !== undefined) localStorage.setItem('userId', String(session.userId));
    if (session?.clientId !== undefined && session.clientId !== null) {
      localStorage.setItem('clientId', String(session.clientId));
    } else {
      localStorage.removeItem('clientId');
    }

    const policySource = Object.prototype.hasOwnProperty.call(session || {}, 'privacyPolicyRequired')
      ? session
      : response;
    if (Object.prototype.hasOwnProperty.call(policySource || {}, 'privacyPolicyRequired')) {
      const incomingVersion = policySource.privacyPolicyVersion;
      const previousVersion = localStorage.getItem('privacyPolicyVersion');
      const versionChanged = incomingVersion !== undefined && previousVersion !== null &&
        String(incomingVersion) !== previousVersion;
      this.setPolicyPending(policySource.privacyPolicyRequired === true || versionChanged, incomingVersion);
      if (incomingVersion !== undefined) {
        localStorage.setItem('privacyPolicyVersion', String(incomingVersion));
      }
    }
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
    localStorage.removeItem('role');
    localStorage.removeItem('clientId');
    localStorage.removeItem('privacyPolicyPending');
    localStorage.removeItem('privacyPolicyVersion');
    this.policyPendingSubject.next(false);
  }

  // Verificar si el usuario está autenticado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isPrivacyPolicyPending(): boolean {
    return this.policyPendingSubject.value;
  }

  markPrivacyPolicyPending(version?: string | number): void {
    this.setPolicyPending(true, version);
  }

  private setPolicyPending(pending: boolean, version?: string | number): void {
    this.policyPendingSubject.next(pending);
    if (pending) {
      localStorage.setItem('privacyPolicyPending', 'true');
      if (version !== undefined) {
        localStorage.setItem('privacyPolicyVersion', String(version));
      }
    } else {
      localStorage.removeItem('privacyPolicyPending');
    }
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getClientId(): number | null {
    const value = localStorage.getItem('clientId');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
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
