import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { IDLE_LOCK_MS, IDLE_LOGOUT_MS, IdleLockService } from './idle-lock.service';

describe('IdleLockService', () => {
  let service: IdleLockService;
  let auth: jasmine.SpyObj<AuthService> & { session$: BehaviorSubject<boolean> };
  let router: jasmine.SpyObj<Router> & { events: Subject<unknown> };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'logoutRemote', 'unlock']) as typeof auth;
    sessionStorage.clear();
    auth.session$ = new BehaviorSubject(true);
    auth.isLoggedIn.and.returnValue(true);
    auth.logoutRemote.and.returnValue(of(void 0));
    router = jasmine.createSpyObj('Router', ['navigate']) as typeof router;
    router.events = new Subject<any>() as typeof router.events;

    TestBed.configureTestingModule({
      providers: [
        IdleLockService,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  afterEach(() => {
    service.ngOnDestroy();
    sessionStorage.clear();
  });

  it('bloquea después de 2 minutos y 30 segundos', fakeAsync(() => {
    service = TestBed.inject(IdleLockService);
    let locked = false;
    service.locked$.subscribe(value => locked = value);

    (service as any).lastActivity = Date.now() - IDLE_LOCK_MS;
    tick(1000);

    expect(locked).toBeTrue();
    expect(sessionStorage.getItem('idleLockActive')).toBe('true');
    expect(auth.logoutRemote).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('cierra la sesión después de 5 minutos', fakeAsync(() => {
    service = TestBed.inject(IdleLockService);
    (service as any).lastActivity = Date.now() - IDLE_LOGOUT_MS;
    tick(1000);

    expect(auth.logoutRemote).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    discardPeriodicTasks();
  }));

  it('reinicia el contador con actividad', fakeAsync(() => {
    service = TestBed.inject(IdleLockService);
    (service as any).lastActivity = Date.now() - (IDLE_LOCK_MS - 1000);
    service.recordActivity();
    tick(1000);

    let locked = false;
    service.locked$.subscribe(value => locked = value);
    expect(locked).toBeFalse();
    discardPeriodicTasks();
  }));

  it('reinicia el contador al desbloquear correctamente', fakeAsync(() => {
    service = TestBed.inject(IdleLockService);
    auth.unlock.and.returnValue(of({}));
    (service as any).lastActivity = Date.now() - IDLE_LOCK_MS;
    tick(1000);
    service.unlock('correcta').subscribe(() => service.completeUnlock());
    tick();

    expect(auth.unlock).toHaveBeenCalledWith('correcta');
    expect((service as any).lockedSubject.value).toBeFalse();
    expect(sessionStorage.getItem('idleLockActive')).toBeNull();
    discardPeriodicTasks();
  }));

  it('mantiene el bloqueo ante una contraseña inválida', fakeAsync(() => {
    service = TestBed.inject(IdleLockService);
    auth.unlock.and.returnValue(throwError(() => ({ status: 401 })));
    (service as any).lastActivity = Date.now() - IDLE_LOCK_MS;
    tick(1000);
    let errorStatus = 0;
    service.unlock('incorrecta').subscribe({ error: error => errorStatus = error.status });
    tick();

    expect(errorStatus).toBe(401);
    expect((service as any).lockedSubject.value).toBeTrue();
    expect(auth.logoutRemote).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));
});
