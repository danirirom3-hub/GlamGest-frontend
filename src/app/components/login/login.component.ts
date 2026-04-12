import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  readonly ArrowLeft = ArrowLeft;

  usuario = { email: '', password: '' };

  mensaje: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.mensaje = '';

    if (!this.usuario.email || !this.usuario.password) {
      this.mensaje = 'Debes ingresar correo y contraseña.';
      return;
    }

    this.authService.login(this.usuario).subscribe({
      next: (res: any) => {
        const token = res?.data?.token;
        if (token) {
          this.authService.saveToken(token);
          this.mensaje = 'Login exitoso. Redirigiendo...';
          this.router.navigate(['/dashboard']);
        } else {
          this.mensaje = res?.message || 'No se pudo iniciar sesión.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Usuario o contraseña incorrectos.';
      }
    });
  }
}