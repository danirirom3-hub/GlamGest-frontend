import { Routes } from '@angular/router';

// Componentes principales
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

// Componentes del dashboard
import { ServicesComponent } from './components/services/services.component';
import { ClientsComponent } from './components/clients/clients.component';
import { SalesComponent } from './components/sales/sales.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';

// ✅ SOLO ESTE IMPORT NUEVO
import { EmployeesComponent } from './components/employees/employees.component';

export const routes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },

  { path: 'users', component: UsersComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],   
    children: [
      { path: 'services', component: ServicesComponent },
      { path: 'clients', component: ClientsComponent },

      // ✅ SOLO ESTA LÍNEA NUEVA
      { path: 'employees', component: EmployeesComponent },

      { path: 'sales', component: SalesComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: '', redirectTo: 'services', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'home' }
];