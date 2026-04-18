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

  // Iconos
  icons = {
    arrowLeft: ArrowLeft
  };

  // Datos del usuario
  user = { email: '', password: '' };

  // Mensaje en pantalla
  message: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Maneja el login
  onLogin() {
    this.message = '';

    if (!this.user.email || !this.user.password) {
      this.message = 'Debes ingresar correo y contraseña.';
      return;
    }

    this.authService.login(this.user).subscribe({
      next: (res: any) => {
        const token = res?.data?.token;

        if (token) {
          this.authService.saveToken(token);
          this.message = 'Login exitoso. Redirigiendo...';
          this.router.navigate(['/dashboard']);
        } else {
          this.message = res?.message || 'No se pudo iniciar sesión.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Usuario o contraseña incorrectos.';
      }
    });
  }

}