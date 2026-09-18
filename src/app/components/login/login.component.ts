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
        const token =
          res?.data?.token ||
          res?.token ||
          res?.accessToken;

        if (token) {
          this.authService.saveSession(res);

          // Guardar userId en localStorage si el backend lo devuelve
          let userId =
            res?.data?.user?.id ||
            res?.data?.userId ||
            res?.data?.id ||
            res?.user?.id ||
            res?.userId ||
            res?.id;

          if (!userId) {
            userId = this.authService.getUserId();
          }

           if (userId) {
            localStorage.setItem('userId', String(userId));
            localStorage.setItem('user_id', String(userId));
            localStorage.setItem('id', String(userId));
          }

           const role = res?.data?.role || res?.role;
           if (role !== 'ADMIN' && role !== 'CLIENT') {
             this.authService.logout();
             this.message = 'La respuesta de autenticación no contiene un rol válido.';
             this.messageType = 'error';
             return;
           }

           this.message = 'Login exitoso. Redirigiendo...';
          this.messageType = 'success';

          setTimeout(() => {
             this.router.navigate([role === 'ADMIN' ? '/dashboard' : '/client']);
          }, 1500);

        } else {
          this.message = res?.message || 'No se pudo iniciar sesión.';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.message = this.getErrorMessage(err, 'Usuario o contraseña incorrectos.');
        this.messageType = 'error';
      }
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 8080.';
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }

}
