import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class ClientGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn() && this.authService.isPrivacyPolicyPending()) {
      this.router.navigate(['/privacy-policy']);
      return false;
    }
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'CLIENT') return true;
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return false;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
