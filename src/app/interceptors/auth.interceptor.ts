import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const isPublicAuthRequest = request.url.endsWith('/auth/login') ||
    request.url.endsWith('/auth/register') ||
    (request.method === 'GET' && request.url.endsWith('/auth/policy'));
  const authorizedRequest = token && !isPublicAuthRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        if (!isPublicAuthRequest) {
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      } else if (error.status === 403) {
        const body = error?.error?.data || error?.error;
        const policyPending = body?.privacyPolicyRequired === true ||
          body?.code === 'PRIVACY_POLICY_REQUIRED' ||
          body?.errorCode === 'PRIVACY_POLICY_REQUIRED' ||
          body?.message?.toLowerCase?.().includes('política') ||
          body?.message?.toLowerCase?.().includes('privacy policy');

        if (policyPending) {
          authService.markPrivacyPolicyPending(body?.privacyPolicyVersion);
          router.navigate(['/privacy-policy']);
          Swal.fire(
            'Política pendiente',
            'Debes aceptar la política de tratamiento de datos para continuar.',
            'warning'
          );
        } else {
          Swal.fire('Permisos insuficientes', 'No tienes permisos para realizar esta acción.', 'warning');
        }
      }
      return throwError(() => error);
    })
  );
};
