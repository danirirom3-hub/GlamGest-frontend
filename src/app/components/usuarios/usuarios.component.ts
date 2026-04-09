import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  // Solo para mantener los datos de los inputs
  usuario = { nombre: '', password: '', tipo: '' };
  
  // Mensaje fijo para simular feedback visual
  mensaje: string = 'Bienvenido Daniela (Administrador)';

  // Método vacío para simular submit sin lógica real
  login() {
    // Aquí no se hace nada, solo para mantener el (ngSubmit)
  }
}