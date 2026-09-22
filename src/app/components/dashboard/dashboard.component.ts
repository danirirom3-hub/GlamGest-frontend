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
  BarChart3
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
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
    BarChart3
  };

  constructor(
    private authService: AuthService,
    private router: Router
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
      title: '¿Cerrar sesión?',
      text: 'Tendrás que iniciar sesión nuevamente',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.authService.logout();

      Swal.fire({
        icon: 'success',
        title: 'Sesión cerrada',
        timer: 1000,
        showConfirmButton: false
      });

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);

    });
  }
}
