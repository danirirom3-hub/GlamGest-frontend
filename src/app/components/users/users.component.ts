import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {

  // Iconos
  icons = {
    arrowLeft: ArrowLeft
  };

  // Datos del formulario
  user = {
    name: '',
    email: '',
    password: ''
  };

  // Mensaje y tipo para colores
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false; // Estado de carga

  constructor(private authService: AuthService) {}

  // Registrar usuario
  registerUser() {
    this.message = '';

    if (!this.user.name || !this.user.email || !this.user.password) {
      this.message = 'Completa todos los campos para registrar el usuario.';
      this.messageType = 'error';
      return;
    }

    const payload = {
      active: true,
      email: this.user.email,
      name: this.user.name,
      password: this.user.password,
      roleId: 1
    };

    this.isLoading = true; // Activar carga

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false; // Desactivar carga
        if (res?.successful) {
          this.message = 'Usuario registrado correctamente.';
          this.messageType = 'success';
          this.user = { name: '', email: '', password: '' };
        } else {
          this.message = res?.message || 'No se pudo registrar el usuario.';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.isLoading = false; // Desactivar carga
        this.message = err?.error?.message || 'Error al registrar el usuario.';
        this.messageType = 'error';
      }
    });
  }

}