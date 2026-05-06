import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Scissors, 
  Users, 
  ShoppingCart, 
  Calendar, 
  User,
  Settings
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  /* Iconos usados en el menú */
  icons = {
    Scissors,
    Users,
    ShoppingCart,
    Calendar,
    User,
    Settings
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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