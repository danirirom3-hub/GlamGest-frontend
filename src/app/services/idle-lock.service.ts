import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService } from './auth.service';

export const IDLE_LOCK_MS = 2.5 * 60 * 1000;
export const IDLE_LOGOUT_MS = 5 * 60 * 1000;
export const IDLE_LOCK_STORAGE_KEY = 'idleLockActive';

@Injectable({ providedIn: 'root' })
export class IdleLockService implements OnDestroy {
  private readonly lockedSubject = new BehaviorSubject<boolean>(false);
  readonly locked$ = this.lockedSubject.asObservable();
  private lastActivity = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly subscriptions = new Subscription();
  private readonly activityEvents = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.subscriptions.add(this.authService.session$.subscribe(isLoggedIn => {
      if (isLoggedIn) this.start();
      else this.stop();
    }));
    this.subscriptions.add(this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.authService.isLoggedIn()) this.recordActivity();
    }));
    this.activityEvents.forEach(event => this.document.addEventListener(event, this.onActivity, { passive: true }));
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  start(): void {
    this.lastActivity = Date.now();
    this.lockedSubject.next(false);
    this.clearTimer();
    this.timerId = setInterval(() => this.checkTimeouts(), 1000);
  }

  stop(): void {
    this.clearTimer();
    this.lastActivity = 0;
    this.lockedSubject.next(false);
    sessionStorage.removeItem(IDLE_LOCK_STORAGE_KEY);
  }

  recordActivity(): void {
    if (this.authService.isLoggedIn() && !this.lockedSubject.value) this.lastActivity = Date.now();
  }

  unlock(password: string): Observable<unknown> {
    return this.authService.unlock(password);
  }

  completeUnlock(): void {
    this.lockedSubject.next(false);
    this.lastActivity = Date.now();
    sessionStorage.removeItem(IDLE_LOCK_STORAGE_KEY);
  }

  ngOnDestroy(): void {
    this.stop();
    this.subscriptions.unsubscribe();
    this.activityEvents.forEach(event => this.document.removeEventListener(event, this.onActivity));
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private readonly onActivity = (): void => this.recordActivity();

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.checkTimeouts();
  };

  private checkTimeouts(): void {
    if (!this.authService.isLoggedIn() || !this.lastActivity) return;
    const elapsed = Date.now() - this.lastActivity;
    if (elapsed >= IDLE_LOGOUT_MS) {
      this.stop();
      this.authService.logout();
      void this.router.navigate(['/login'], { replaceUrl: true });
    } else if (elapsed >= IDLE_LOCK_MS) {
      this.lockedSubject.next(true);
      sessionStorage.setItem(IDLE_LOCK_STORAGE_KEY, 'true');
    }
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
