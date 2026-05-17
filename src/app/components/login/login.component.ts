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

  // Mensaje y tipo para colores
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Maneja el login
  onLogin() {
    this.message = '';

    if (!this.user.email || !this.user.password) {
      this.message = 'Debes ingresar correo y contraseña.';
      this.messageType = 'error';
      return;
    }

    this.authService.login(this.user).subscribe({
      next: (res: any) => {
        const token = res?.data?.token;

        if (token) {
          this.authService.saveToken(token);
          // Guardar userId en localStorage si el backend lo devuelve
          const userId = res?.data?.user?.id || res?.data?.userId || res?.data?.id;
          if (userId) {
            localStorage.setItem('userId', String(userId));
            localStorage.setItem('user_id', String(userId));
          }
          this.message = 'Login exitoso. Redirigiendo...';
          this.messageType = 'success';
          
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
          
        } else {
          this.message = res?.message || 'No se pudo iniciar sesión.';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Usuario o contraseña incorrectos.';
        this.messageType = 'error';
      }
    });
  }

}