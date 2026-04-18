import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LogIn, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  // Iconos
  icons = {
    logIn: LogIn,
    userPlus: UserPlus
  };

}