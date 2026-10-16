import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const translate = inject(TranslateService);
  const token = authService.getToken();
  const isPublicAuthRequest = request.url.endsWith('/auth/login') ||
    request.url.endsWith('/auth/register') ||
    (request.method === 'GET' && request.url.endsWith('/auth/policy'));
  const isUnlockRequest = request.url.endsWith('/auth/unlock');
  const isLogoutRequest = request.url.endsWith('/auth/logout');
  const authorizedRequest = token && !isPublicAuthRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error) => {
      if (error.status === 401 && !isUnlockRequest && !isLogoutRequest) {
        const body = error?.error?.data || error?.error;
        const sessionReplaced = body?.code === 'SESSION_REPLACED';
        authService.logout();
        if (!isPublicAuthRequest) {
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          void Swal.fire(
            translate.instant(sessionReplaced ? 'errors.sessionReplacedTitle' : 'errors.sessionExpiredTitle'),
            translate.instant(sessionReplaced ? 'errors.sessionReplacedText' : 'errors.sessionExpiredText'),
            'warning'
          );
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
            translate.instant('errors.policyPendingTitle'),
            translate.instant('errors.policyPendingText'),
            'warning'
          );
        } else {
          Swal.fire(translate.instant('errors.forbiddenTitle'), translate.instant('errors.forbidden'), 'warning');
        }
      }
      return throwError(() => error);
    })
  );
};
