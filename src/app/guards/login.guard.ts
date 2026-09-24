import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      return true;
    }

    if (this.authService.isPrivacyPolicyPending()) {
      this.router.navigate(['/privacy-policy']);
      return false;
    }

    this.router.navigate([this.authService.getRole() === 'CLIENT' ? '/client' : '/dashboard']);
    return false;
  }
}
