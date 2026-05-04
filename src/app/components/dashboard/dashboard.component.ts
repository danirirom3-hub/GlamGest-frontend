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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}