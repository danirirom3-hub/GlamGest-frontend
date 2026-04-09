import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent {

  // =========================
  // 🧾 FORMULARIO (SOLO VISUAL)
  // =========================
  nuevoCliente = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: ''
  };

  // =========================
  // 🔍 BUSCADOR (VISUAL)
  // =========================
  busqueda: string = '';

  // =========================
  // ✏️ MODO EDICIÓN (VISUAL)
  // =========================
  editando: boolean = false;

  // =========================
  // ✅ ALERTA VISUAL
  // =========================
  mostrarConfirmacion: boolean = false;

  // =========================
  // 🎯 ACCIONES (SIN LÓGICA)
  // =========================
  guardarCliente() {
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 3000);

    this.limpiarFormulario();
  }

  editarCliente() {
    this.editando = true;
  }

  eliminarCliente() {
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 2000);
  }

  limpiarFormulario() {
    this.nuevoCliente = {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      direccion: ''
    };
    this.editando = false;
  }

}