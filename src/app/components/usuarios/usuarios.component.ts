import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  usuario = {
    nombre: '',
    email: '',
    password: '',
    rol: ''
  };

  mensaje: string = '';

  registrar() {
    this.mensaje = 'Usuario registrado correctamente (simulación)';
    console.log('Usuario:', this.usuario);
  }
}