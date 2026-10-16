import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Scissors, 
  Users, 
  ShoppingCart, 
  Calendar, 
  User,
  Settings,
   BarChart3,
  FileText,
  ScrollText
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  sidebarCollapsed = false;

  /* Iconos usados en el menú */
  icons = {
    Scissors,
    Users,
    ShoppingCart,
    Calendar,
    User,
    Settings,
    BarChart3,
    FileText,
    ScrollText
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  get isAdmin(): boolean {
    return this.authService.getRole() === 'ADMIN';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /* Cierra sesión y redirige al login */
  logout(): void {

    Swal.fire({
      title: this.translate.instant('dashboard.logoutTitle'),
      text: this.translate.instant('dashboard.logoutText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesExit'),
      cancelButtonText: this.translate.instant('common.cancel')
    }).then((result) => {

      if (!result.isConfirmed) return;

       this.authService.logoutRemote().subscribe({
         error: () => {
           void this.router.navigate(['/login']);
         },
         complete: () => {
           Swal.fire({
             icon: 'success',
             title: this.translate.instant('dashboard.logoutSuccess'),
             timer: 1000,
             showConfirmButton: false
           });
           setTimeout(() => this.router.navigate(['/login']), 1000);
         }
       });

    });
  }
}
