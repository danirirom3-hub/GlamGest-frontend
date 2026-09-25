import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsersComponent } from './components/users/users.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // se usará para agenda/calendario
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { IdleLockComponent } from './components/idle-lock/idle-lock.component';
import { IDLE_LOCK_STORAGE_KEY } from './services/idle-lock.service';

@Component({
  selector: 'app-root',
  standalone: true, // no usa módulos, todo se importa directamente
  imports: [
    RouterOutlet, // permite navegación por rutas
    IdleLockComponent,
    UsersComponent,
    DashboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'glam-gest'; // nombre base del sistema

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const wasLocked = sessionStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
    if (navigation?.type === 'reload' && wasLocked && this.authService.isLoggedIn()) {
      this.authService.logout();
      void this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

}
