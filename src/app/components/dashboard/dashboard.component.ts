import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Scissors, Users, ShoppingCart, Calendar } from 'lucide-angular';

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
}