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
  const isPublicAuthRequest = request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register');
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
        Swal.fire('Permisos insuficientes', 'No tienes permisos para realizar esta acción.', 'warning');
      }
      return throwError(() => error);
    })
  );
};
