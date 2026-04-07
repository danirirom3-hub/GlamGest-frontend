import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  standalone: true,        // <-- Lo hacemos standalone
  imports: [FormsModule],  // <-- Necesario para ngModel
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  usuario = { nombre: '', password: '', tipo: '' };
  mensaje: string = '';

  login() {
    if (this.usuario.nombre && this.usuario.password && this.usuario.tipo) {
      this.mensaje = `Bienvenido ${this.usuario.nombre} (${this.usuario.tipo})`;
    } else {
      this.mensaje = 'Por favor complete todos los campos';
    }
  }
}