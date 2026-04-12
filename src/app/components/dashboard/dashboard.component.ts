import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Scissors, Users, ShoppingCart, Calendar } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  icons = {
    Scissors,
    Users,
    ShoppingCart,
    Calendar
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}