import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  usuario = { nombre: '', password: '', tipo: '' };

  mensaje: string = '';

  login() {
    this.mensaje = 'Bienvenido (simulación)';
  }
}