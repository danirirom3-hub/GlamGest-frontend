import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  readonly ArrowLeft = ArrowLeft;

  usuario = {
    nombre: '',
    email: '',
    password: ''
  };

  mensaje: string = '';

  registrar() {
    this.mensaje = 'Usuario registrado correctamente (simulación)';
    console.log('Usuario:', this.usuario);
  }
}