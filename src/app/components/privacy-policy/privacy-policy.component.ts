import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, PrivacyPolicy } from '../../services/auth.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  accepted = false;
  isLoading = false;
  isPolicyLoading = true;
  message = '';
  policy: PrivacyPolicy | null = null;
  private returnUrl = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
    this.loadPolicy();
  }

  get isRequired(): boolean {
    return this.authService.isPrivacyPolicyPending();
  }

  private loadPolicy(): void {
    this.authService.getPrivacyPolicy().subscribe({
      next: (response) => {
        this.policy = response.data;
        this.isPolicyLoading = false;
      },
      error: () => {
        this.isPolicyLoading = false;
        this.message = this.translate.instant('privacy.loadError');
      }
    });
  }

  confirm(): void {
    if (!this.accepted || this.isLoading) {
      this.message = this.translate.instant('privacy.mustAccept');
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.authService.acceptPrivacyPolicy().subscribe({
      next: () => {
        this.isLoading = false;
        const role = this.authService.getRole();
        this.router.navigate([role === 'CLIENT' ? '/client' : '/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.message = this.translate.instant('privacy.acceptError');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goBack(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}
