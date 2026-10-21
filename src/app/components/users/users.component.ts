import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { RecaptchaComponent, RecaptchaModule } from 'ng-recaptcha';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiErrorMapper } from '../../services/api-error.mapper';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule, RecaptchaModule, TranslateModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {

  @ViewChild(RecaptchaComponent) recaptchaComponent?: RecaptchaComponent;
  readonly recaptchaSiteKey = environment.RECAPTCHA_SITE_KEY;
  recaptchaToken: string | null = null;

  // Iconos utilizados en la vista.
  icons = {
    arrowLeft: ArrowLeft
  };

  // Valores del formulario de registro.
  user: { name: string; email: string; password: string; phone?: string; privacyPolicyAccepted: boolean } = {
    name: '',
    email: '',
    password: '',
    phone: '',
    privacyPolicyAccepted: false
  };

  // Mensaje mostrado y estilo visual asociado.
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false; // Indica si hay una petición en curso.

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) {}

  // Registra un nuevo usuario interno.
  registerUser() {
    this.message = '';

    if (!this.user.name || !this.user.email || !this.user.password || !this.user.phone) {
      this.message = this.translate.instant('users.missingFields');
      this.messageType = 'error';
      return;
    }

    if (!this.user.privacyPolicyAccepted) {
      this.message = this.translate.instant('users.privacyRequired');
      this.messageType = 'error';
      return;
    }

    if (this.user.password.length < 8) {
      this.message = this.translate.instant('users.passwordLength');
      this.messageType = 'error';
      return;
    }

    if (!this.recaptchaToken) {
      this.message = this.translate.instant('users.captchaRequired');
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

    this.isLoading = true; // Bloquea el formulario mientras se procesa la petición.

    this.authService.register(payload).pipe(finalize(() => this.resetRecaptcha())).subscribe({
      next: (res: any) => {
        this.isLoading = false; // Permite volver a interactuar con el formulario.
        if (res?.successful) {
          this.message = this.translate.instant('users.success');
          this.messageType = 'success';
           this.user = { name: '', email: '', password: '', phone: '', privacyPolicyAccepted: false };
        } else {
           this.message = this.errorMapper.localize(res?.message, 'users.registerError');
          this.messageType = 'error';
        }
      },
      error: (err) => {
        this.isLoading = false; // Permite volver a interactuar con el formulario.
        this.message = this.isInvalidRecaptchaError(err)
          ? this.translate.instant('users.captchaInvalid')
          : this.getErrorMessage(err, this.translate.instant('users.genericError'));
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
    return this.errorMapper.resolve(error, fallback);
  }

}
