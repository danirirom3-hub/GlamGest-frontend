/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent], // Al ser Standalone se importa directamente
      providers: [
        // Proveedor mock de ActivatedRoute para evitar fallos si el HTML usa routerLink
        { 
          provide: ActivatedRoute, 
          useValue: { params: of({}), snapshot: { paramMap: { get: () => null } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara el ciclo de vida inicial
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería tener configurados los íconos de inicio de sesión y registro', () => {
    expect(component.icons.logIn).toBeTruthy();
    expect(component.icons.userPlus).toBeTruthy();
  });
});