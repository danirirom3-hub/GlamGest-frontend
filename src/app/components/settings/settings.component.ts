import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BackupsService, BackupInfo } from '../../services/backups.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService, SupportedLanguage } from '../../services/language.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ApiErrorMapper } from '../../services/api-error.mapper';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LocalizedDatePipe],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  currentTheme: string = 'default';
  backups: BackupInfo[] = [];
  isLoadingBackups = false;
  isCreatingBackup = false;
  selectedSection: 'visual' | 'backups' = 'visual';
  language: SupportedLanguage;

  constructor(
    private backupsService: BackupsService,
    private authService: AuthService,
    private router: Router,
    private languageService: LanguageService,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) { this.language = this.languageService.currentLanguage; }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
    this.language = language;
  }

  setTheme(theme: string) {
    const body = document.body;

    // limpiar temas reales
    body.classList.remove('dark', 'femenino');

    // aplicar si no es default
    if (theme !== 'default') {
      body.classList.add(theme);
    }

    // guardar
    localStorage.setItem('theme', theme);

    this.currentTheme = theme;
  }

  selectSection(section: 'visual' | 'backups'): void {
    this.selectedSection = section;
  }

  ngOnInit() {
    const theme = localStorage.getItem('theme') || 'default';

    const body = document.body;

    body.classList.remove('dark', 'femenino');

    if (theme !== 'default') {
      body.classList.add(theme);
    }

    this.currentTheme = theme;
    this.loadBackups();
  }

  loadBackups(): void {
    this.isLoadingBackups = true;
    this.backupsService.list().subscribe({
      next: backups => this.backups = backups,
      error: error => {
        this.isLoadingBackups = false;
        // The auth interceptor handles expired or replaced sessions globally.
        if (error?.status === 401 || error?.status === 403) return;
        void Swal.fire(this.translate.instant('settings.backups'), this.translate.instant('settings.loadHistoryError'), 'error');
      },
      complete: () => this.isLoadingBackups = false
    });
  }

  createBackup(): void {
    if (this.isCreatingBackup) return;
    this.isCreatingBackup = true;
    this.backupsService.create().subscribe({
      next: backup => {
        this.backups = [backup, ...this.backups];
        Swal.fire(this.translate.instant('settings.backupCreated'), this.translate.instant('settings.backupCreatedDescription'), 'success');
      },
      error: error => {
        this.isCreatingBackup = false;
        void Swal.fire(this.translate.instant('settings.backups'), this.errorMessage(error), 'error');
      },
      complete: () => this.isCreatingBackup = false
    });
  }

  downloadBackup(backup: BackupInfo): void {
    this.backupsService.download(backup.id).subscribe({
      next: response => {
        const blob = response.body;
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glamgest-${backup.id}.sql.gz`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: error => Swal.fire(this.translate.instant('settings.backups'), this.errorMessage(error), 'error')
    });
  }

  restoreBackup(backup: BackupInfo): void {
    Swal.fire({
      title: this.translate.instant('settings.restoreTitle'),
      text: this.translate.instant('settings.restoreText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.restore'),
      cancelButtonText: this.translate.instant('common.cancel'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.backupsService.restore(backup.id).subscribe({
        next: () => {
          void Swal.fire({
            title: this.translate.instant('settings.restoreDoneTitle'),
            text: this.translate.instant('settings.restoreDoneText'),
            icon: 'success',
            confirmButtonText: this.translate.instant('common.goToLogin'),
            allowOutsideClick: false
          }).then(() => {
            this.authService.logout();
            void this.router.navigate(['/login'], { replaceUrl: true });
          });
        },
        error: error => Swal.fire(this.translate.instant('settings.restore'), this.errorMessage(error), 'error')
      });
    });
  }

  deleteBackup(backup: BackupInfo): void {
    Swal.fire({
      title: this.translate.instant('settings.deleteTitle'),
      text: this.translate.instant('settings.backupDeleteDescription'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.delete'),
      cancelButtonText: this.translate.instant('common.cancel'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.backupsService.delete(backup.id).subscribe({
        next: () => this.backups = this.backups.filter(item => item.id !== backup.id),
        error: error => Swal.fire(this.translate.instant('settings.backups'), this.errorMessage(error), 'error')
      });
    });
  }

  formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private errorMessage(error: any): string {
    return this.errorMapper.resolve(error, this.translate.instant('settings.operationError'));
  }

  isActive(theme: string): boolean {
    return this.currentTheme === theme;
  }
}
