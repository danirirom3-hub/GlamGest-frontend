import { Routes } from '@angular/router';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ServiciosComponent } from './components/servicios/servicios.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { VentasComponent } from './components/ventas/ventas.component'; 
import { CitasComponent } from './components/citas/citas.component'; // NUEVO

export const routes: Routes = [
  // Ruta raíz redirige a usuarios
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  
  // Ruta para usuarios
  { path: 'usuarios', component: UsuariosComponent },

  // Dashboard con rutas hijas
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'servicios', component: ServiciosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'ventas', component: VentasComponent }, // NUEVO
      { path: 'citas', component: CitasComponent }, // NUEVO
      { path: '', redirectTo: 'servicios', pathMatch: 'full' } // Si no hay ruta hija, va a servicios
    ]
  },

  // Ruta comodín (opcional, para no perderse)
  { path: '**', redirectTo: 'usuarios' }
];