import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {

  // URL base del endpoint de citas (tomada desde variables de entorno)
  private apiUrl = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  // Crear una nueva cita
  createAppointment(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Obtener todas las citas
  getAppointments(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Obtener una cita específica por su ID
  getAppointmentById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Actualizar una cita existente
  updateAppointment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar una cita por su ID
  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}