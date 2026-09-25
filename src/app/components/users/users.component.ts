import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { RecaptchaComponent, RecaptchaModule } from 'ng-recaptcha';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule, RecaptchaModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {

  @ViewChild(RecaptchaComponent) recaptchaComponent?: RecaptchaComponent;
  readonly recaptchaSiteKey = environment.RECAPTCHA_SITE_KEY;
  recaptchaToken: string | null = null;

  // Iconos
  icons = {
    arrowLeft: ArrowLeft
  };

  // Datos del formulario
  user: { name: string; email: string; password: string; phone?: string; privacyPolicyAccepted: boolean } = {
    name: '',
    email: '',
    password: '',
    phone: '',
    privacyPolicyAccepted: false
  };

  // Mensaje y tipo para colores
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false; // Estado de carga

  constructor(private authService: AuthService) {}

  // Registrar usuario
  registerUser() {
    this.message = '';

    if (!this.user.name || !this.user.email || !this.user.password || !this.user.phone) {
      this.message = 'Completa todos los campos para registrar el usuario.';
      this.messageType = 'error';
      return;
    }

    if (!this.user.privacyPolicyAccepted) {
      this.message = 'Debes aceptar la política de tratamiento de datos.';
      this.messageType = 'error';
      return;
    }

    if (this.user.password.length < 8) {
      this.message = 'La contraseña debe tener al menos 8 caracteres.';
      this.messageType = 'error';
      return;
    }

    if (!this.recaptchaToken) {
      this.message = 'Completa el captcha antes de registrar el usuario.';
      this.messageType = 'error';
      return;
    }

    const payload = {
      name: this.user.name,
      email: this.user.email,
      password: this.user.password,
      phone: this.user.phone,
      privacyPolicyAccepted: true,
      recaptchaToken: this.recaptchaToken
    };

    this.isLoading = true; // Activar carga

    this.authService.register(payload).pipe(finalize(() => this.resetRecaptcha())).subscribe({
      next: (res: any) => {
        this.isLoading = false; // Desactivar carga
        if (res?.successful) {
          this.message = 'Usuario registrado correctamente.';
          this.messageType = 'success';
           this.user = { name: '', email: '', password: '', phone: '', privacyPolicyAccepted: false };
        } else {
          this.message = res?.message || 'No se pudo registrar el usuario.';
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.isLoading = false; // Desactivar carga
        this.message = this.isInvalidRecaptchaError(err)
          ? 'El captcha no es válido o ha expirado. Complétalo nuevamente.'
          : this.getErrorMessage(err, 'Error al registrar el usuario.');
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
    const validationErrors = error?.error?.data;
    if (validationErrors && typeof validationErrors === 'object') {
      return Object.values(validationErrors).join(' ');
    }
    return error?.error?.error || error?.error?.message || error?.message || fallback;
  }

}
