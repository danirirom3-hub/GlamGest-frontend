import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Cliente {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent {

  clientes: Cliente[] = [
    { nombre: 'Daniela', apellido: 'Rincón', correo: 'daniela@mail.com', telefono: '3001234567', direccion: 'Calle 1 #23-45' },
    { nombre: 'Felipe', apellido: 'Hernandez', correo: 'felipe@mail.com', telefono: '3009876543', direccion: 'Carrera 5 #67-89' }
  ];

  nuevoCliente: Cliente = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: ''
  };

  editando = false;
  indiceEditando: number | null = null;
  busqueda = '';

  guardarCliente() {
    if (!this.nuevoCliente.nombre || !this.nuevoCliente.apellido) return;

    if (this.editando && this.indiceEditando !== null) {
      this.clientes[this.indiceEditando] = { ...this.nuevoCliente };
      this.editando = false;
      this.indiceEditando = null;
    } else {
      this.clientes.push({ ...this.nuevoCliente });
    }

    this.limpiarFormulario();
  }

  editarCliente(index: number) {
    this.nuevoCliente = { ...this.clientes[index] };
    this.editando = true;
    this.indiceEditando = index;
  }

  eliminarCliente(index: number) {
    this.clientes.splice(index, 1);
  }

  limpiarFormulario() {
    this.nuevoCliente = {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      direccion: ''
    };
  }

  clientesFiltrados() {
    return this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      c.apellido.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      c.correo.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}