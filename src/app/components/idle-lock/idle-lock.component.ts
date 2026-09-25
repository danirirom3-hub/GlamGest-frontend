import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IdleLockService } from '../../services/idle-lock.service';

@Component({
  selector: 'app-idle-lock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idle-lock.component.html',
  styleUrls: ['./idle-lock.component.css']
})
export class IdleLockComponent implements OnInit, OnDestroy {
  @ViewChild('passwordInput') passwordInput?: ElementRef<HTMLInputElement>;
  visible = false;
  showPassword = false;
  password = '';
  message = '';
  messageType: 'error' | 'info' = 'info';
  private subscription?: Subscription;

  constructor(private idleLock: IdleLockService) {}

  ngOnInit(): void {
    this.subscription = this.idleLock.locked$.subscribe(locked => {
      this.visible = locked;
      if (locked) {
        this.message = '';
        setTimeout(() => this.passwordInput?.nativeElement.focus());
      } else {
        this.password = '';
        this.showPassword = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  unlock(): void {
    if (!this.password) {
      this.message = 'Ingresa tu contraseña para continuar.';
      this.messageType = 'error';
      return;
    }
    this.message = '';
    this.idleLock.unlock(this.password).subscribe({
      next: () => this.idleLock.completeUnlock(),
      error: error => {
        this.messageType = 'error';
        this.message = error?.status === 401
          ? 'La contraseña es incorrecta.'
          : 'No se pudo conectar con el servidor. Inténtalo nuevamente.';
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  keepFocusInside(event: KeyboardEvent): void {
    if (!this.visible) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog || event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, input'))
      .filter(element => !element.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
