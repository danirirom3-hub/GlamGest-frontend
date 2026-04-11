import { Routes } from '@angular/router';

// Componentes principales
import { HomeComponent } from './components/home/home.component'; 
import { LoginComponent } from './components/login/login.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Componentes del dashboard
import { ServiciosComponent } from './components/servicios/servicios.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { VentasComponent } from './components/ventas/ventas.component';
import { CitasComponent } from './components/citas/citas.component';

export const routes: Routes = [

  // Cuando inicia la app, muestra el home
  { path: '', component: HomeComponent },

  // Página de inicio de sesión
  { path: 'login', component: LoginComponent },

  // Página para registrar usuarios
  { path: 'usuarios', component: UsuariosComponent },

  // Dashboard principal con sus vistas internas
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'servicios', component: ServiciosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'ventas', component: VentasComponent },
      { path: 'citas', component: CitasComponent },

      // Si entra a dashboard sin nada más, muestra servicios
      { path: '', redirectTo: 'servicios', pathMatch: 'full' }
    ]
  },

  // Si la ruta no existe, vuelve al home
  { path: '**', redirectTo: '' }
];