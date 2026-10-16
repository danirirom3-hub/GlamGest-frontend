import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LogIn, UserPlus } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslateModule],
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