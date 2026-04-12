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

  // Formulario de cliente
  nuevoCliente = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: ''
  };

  // Lista de clientes
  clientes = [
    {
      nombre: 'Daniela',
      apellido: 'Rincón',
      correo: 'daniela@mail.com',
      telefono: '3001234567',
      direccion: 'Fusagasugá'
    },
    {
      nombre: 'Felipe',
      apellido: 'Hernandez',
      correo: 'felipe@mail.com',
      telefono: '3009876543',
      direccion: 'Bogotá'
    }
  ];

  // Texto del buscador
  busqueda: string = '';

  // Modo edición
  editando: boolean = false;

  // Mensaje de confirmación
  mostrarConfirmacion: boolean = false;

  // Filtrar clientes por nombre, correo o teléfono
  clientesFiltrados() {
    if (!this.busqueda) {
      return this.clientes;
    }

    const texto = this.busqueda.toLowerCase();

    return this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.apellido.toLowerCase().includes(texto) ||
      cliente.correo.toLowerCase().includes(texto) ||
      cliente.telefono.includes(texto)
    );
  }

  // Guardar cliente
  guardarCliente() {
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 3000);

    this.limpiarFormulario();
  }

  // Activar edición de cliente
  editarCliente(cliente?: any) {
    this.editando = true;

    if (cliente) {
      this.nuevoCliente = { ...cliente };
    }
  }

  // Eliminar cliente
  eliminarCliente(cliente?: any) {
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 2000);

    if (cliente) {
      this.clientes = this.clientes.filter(c => c !== cliente);
    }
  }

  // Limpiar formulario
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