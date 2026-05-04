import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsersComponent } from './components/users/users.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // se usará para agenda/calendario

@Component({
  selector: 'app-root',
  standalone: true, // no usa módulos, todo se importa directamente
  imports: [
    RouterOutlet, // permite navegación por rutas
    UsersComponent,
    DashboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'glam-gest'; // nombre base del sistema

}