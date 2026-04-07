import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent {

  servicios = [
    {
      nombre: 'Corte de cabello',
      precio: 20000,
      duracion: '30 min',
      descripcion: 'Corte moderno y estilizado'
    },
    {
      nombre: 'Manicure',
      precio: 15000,
      duracion: '45 min',
      descripcion: 'Cuidado y esmaltado de uñas'
    }
  ];

  nuevoServicio = {
    nombre: '',
    precio: 0,
    duracion: '',
    descripcion: ''
  };

  // 🔥 NUEVO
  editando = false;
  indiceEditando: number | null = null;

  // 🔥 REEMPLAZA agregarServicio
  guardarServicio() {
    if (!this.nuevoServicio.nombre || !this.nuevoServicio.precio) return;

    if (this.editando && this.indiceEditando !== null) {
      // EDITAR
      this.servicios[this.indiceEditando] = { ...this.nuevoServicio };
      this.editando = false;
      this.indiceEditando = null;
    } else {
      // CREAR
      this.servicios.push({ ...this.nuevoServicio });
    }

    this.limpiarFormulario();
  }

  editarServicio(index: number) {
    this.nuevoServicio = { ...this.servicios[index] };
    this.editando = true;
    this.indiceEditando = index;
  }

  eliminarServicio(index: number) {
    this.servicios.splice(index, 1);
  }

  limpiarFormulario() {
    this.nuevoServicio = {
      nombre: '',
      precio: 0,
      duracion: '',
      descripcion: ''
    };
  }
}