import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RecaptchaComponent, RecaptchaModule } from 'ng-recaptcha';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule, RecaptchaModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  @ViewChild(RecaptchaComponent) recaptchaComponent?: RecaptchaComponent;
  readonly recaptchaSiteKey = environment.RECAPTCHA_SITE_KEY;
  recaptchaToken: string | null = null;

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

    if (!this.recaptchaToken) {
      this.message = 'Completa el captcha antes de iniciar sesión.';
      this.messageType = 'error';
      return;
    }

    const payload = {
      email: this.user.email,
      password: this.user.password,
      recaptchaToken: this.recaptchaToken,
      website: ''
    };

    this.authService.login(payload).pipe(finalize(() => this.resetRecaptcha())).subscribe({
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

           if (this.authService.isPrivacyPolicyPending()) {
             this.router.navigate(['/privacy-policy']);
             return;
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
        this.message = this.isInvalidRecaptchaError(err)
          ? 'El captcha no es válido o ha expirado. Complétalo nuevamente.'
          : this.getErrorMessage(err, 'Usuario o contraseña incorrectos.');
        this.messageType = 'error';
      }
    });
  }

  onRecaptchaResolved(token: string | null): void {
    this.recaptchaToken = token;
  }

  private resetRecaptcha(): void {
    this.recaptchaToken = null;
    this.recaptchaComponent?.reset();
  }

  private isInvalidRecaptchaError(error: any): boolean {
    if (error?.status !== 400) {
      return false;
    }
    const details = JSON.stringify(error?.error || error?.message || '').toLowerCase();
    return details.includes('recaptcha') || details.includes('captcha');
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 8080.';
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }

}
