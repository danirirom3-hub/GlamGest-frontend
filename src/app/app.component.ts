import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UsersComponent } from './components/users/users.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // Módulo utilizado para mostrar la agenda y el calendario.
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { IdleLockComponent } from './components/idle-lock/idle-lock.component';
import { IDLE_LOCK_STORAGE_KEY } from './services/idle-lock.service';
import { TranslateModule } from '@ngx-translate/core';
import { AppearancePreferencesService } from './services/appearance-preferences.service';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-root',
  standalone: true, // El componente importa directamente las dependencias que necesita.
  imports: [
    CommonModule,
    RouterOutlet, // Contenedor para mostrar la vista de la ruta actual.
    IdleLockComponent,
    UsersComponent,
    DashboardComponent,
    TranslateModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'glam-gest'; // Nombre base de la aplicación.
  installEvent: BeforeInstallPromptEvent | null = null;
  showInstallButton = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    // Initialize saved language and appearance before any route renders.
    appearancePreferences: AppearancePreferencesService
  ) {
    void appearancePreferences.currentLanguage;
  }

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.captureInstallPrompt);
    window.addEventListener('appinstalled', this.clearInstallPrompt);
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const wasLocked = sessionStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
    if (navigation?.type === 'reload' && wasLocked && this.authService.isLoggedIn()) {
      this.authService.logout();
      void this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  async installApp(): Promise<void> {
    if (!this.installEvent) return;
    const event = this.installEvent;
    this.clearInstallPrompt();
    await event.prompt();
    await event.userChoice;
  }

  private readonly captureInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.installEvent = event as BeforeInstallPromptEvent;
    this.showInstallButton = true;
  };

  private readonly clearInstallPrompt = (): void => {
    this.installEvent = null;
    this.showInstallButton = false;
  };

}
