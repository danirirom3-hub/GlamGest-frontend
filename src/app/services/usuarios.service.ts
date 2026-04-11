import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  // url del backend (se cambia después)
  private apiUrl = 'http://TU_BACKEND_URL/api/usuarios';

  constructor(private http: HttpClient) { }

  // crear usuario
  crearUsuario(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ver todos los usuarios
  obtenerUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ver usuario por id
  obtenerUsuarioPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // actualizar usuario
  actualizarUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}