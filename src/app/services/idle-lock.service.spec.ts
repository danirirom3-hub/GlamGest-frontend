import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { IDLE_LOCK_MS, IDLE_LOGOUT_MS, IdleLockService } from './idle-lock.service';

describe('IdleLockService', () => {
  let service: IdleLockService;
  let auth: jasmine.SpyObj<AuthService> & { session$: BehaviorSubject<boolean> };
  let router: jasmine.SpyObj<Router> & { events: Subject<unknown> };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'logout', 'unlock']) as typeof auth;
    sessionStorage.clear();
    auth.session$ = new BehaviorSubject(true);
    auth.isLoggedIn.and.returnValue(true);
    router = jasmine.createSpyObj('Router', ['navigate']) as typeof router;
    router.events = new Subject<any>() as typeof router.events;

    TestBed.configureTestingModule({
      providers: [
        IdleLockService,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
    service = TestBed.inject(IdleLockService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    sessionStorage.clear();
  });

  it('bloquea después de 2 minutos y 30 segundos', fakeAsync(() => {
    let locked = false;
    service.locked$.subscribe(value => locked = value);

    tick(IDLE_LOCK_MS);

    expect(locked).toBeTrue();
    expect(sessionStorage.getItem('idleLockActive')).toBe('true');
    expect(auth.logout).not.toHaveBeenCalled();
  }));

  it('cierra la sesión después de 5 minutos', fakeAsync(() => {
    tick(IDLE_LOGOUT_MS);

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  }));

  it('reinicia el contador con actividad', fakeAsync(() => {
    tick(IDLE_LOCK_MS - 1000);
    service.recordActivity();
    tick(2000);

    let locked = false;
    service.locked$.subscribe(value => locked = value);
    expect(locked).toBeFalse();
  }));

  it('reinicia el contador al desbloquear correctamente', fakeAsync(() => {
    auth.unlock.and.returnValue(of({}));
    service.recordActivity();
    tick(IDLE_LOCK_MS);
    service.unlock('correcta').subscribe(() => service.completeUnlock());
    tick();
    tick(IDLE_LOCK_MS - 1000);

    expect(auth.unlock).toHaveBeenCalledWith('correcta');
    expect((service as any).lockedSubject.value).toBeFalse();
    expect(sessionStorage.getItem('idleLockActive')).toBeNull();
  }));

  it('mantiene el bloqueo ante una contraseña inválida', fakeAsync(() => {
    auth.unlock.and.returnValue(throwError(() => ({ status: 401 })));
    tick(IDLE_LOCK_MS);
    let errorStatus = 0;
    service.unlock('incorrecta').subscribe({ error: error => errorStatus = error.status });
    tick();

    expect(errorStatus).toBe(401);
    expect((service as any).lockedSubject.value).toBeTrue();
    expect(auth.logout).not.toHaveBeenCalled();
  }));
});
