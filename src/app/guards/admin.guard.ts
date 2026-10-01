import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(_: unknown, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'ADMIN') return true;
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'CLIENT') {
      this.router.navigate(['/client']);
      return false;
    }
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
