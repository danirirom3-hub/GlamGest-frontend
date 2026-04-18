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

  // Mensaje en pantalla
  message: string = '';

  constructor(private authService: AuthService) {}

  // Registrar usuario
  registerUser() {
    this.message = '';

    if (!this.user.name || !this.user.email || !this.user.password) {
      this.message = 'Completa todos los campos para registrar el usuario.';
      return;
    }

    const payload = {
      active: true,
      email: this.user.email,
      name: this.user.name,
      password: this.user.password,
      roleId: 1
    };

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Usuario registrado correctamente.';
          this.user = { name: '', email: '', password: '' };
        } else {
          this.message = res?.message || 'No se pudo registrar el usuario.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Error al registrar el usuario.';
      }
    });
  }

}