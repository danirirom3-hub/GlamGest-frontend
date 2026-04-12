import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  readonly ArrowLeft = ArrowLeft;

  usuario = {
    name: '',
    email: '',
    password: ''
  };

  mensaje: string = '';

  constructor(private authService: AuthService) {}

  registrar() {
    this.mensaje = '';

    if (!this.usuario.name || !this.usuario.email || !this.usuario.password) {
      this.mensaje = 'Completa todos los campos para registrar el usuario.';
      return;
    }

    const payload = {
      active: true,
      email: this.usuario.email,
      name: this.usuario.name,
      password: this.usuario.password,
      roleId: 1
    };

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Usuario registrado correctamente.';
          this.usuario = { name: '', email: '', password: '' };
        } else {
          this.mensaje = res?.message || 'No se pudo registrar el usuario.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al registrar el usuario.';
      }
    });
  }
}