import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent {

  // Datos del formulario
  newClient = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  };

  // Lista de clientes
  clients = [
    {
      name: 'Daniela',
      lastName: 'Rincón',
      email: 'daniela@mail.com',
      phone: '3001234567',
      address: 'Fusagasugá'
    },
    {
      name: 'Felipe',
      lastName: 'Hernandez',
      email: 'felipe@mail.com',
      phone: '3009876543',
      address: 'Bogotá'
    }
  ];

  // Texto del buscador
  searchText: string = '';

  // Saber si está editando
  isEditing: boolean = false;

  // Mensaje de confirmación
  showConfirmation: boolean = false;

  // Filtra clientes por nombre, correo o teléfono
  filteredClients() {
    if (!this.searchText) {
      return this.clients;
    }

    const text = this.searchText.toLowerCase();

    return this.clients.filter(client =>
      client.name.toLowerCase().includes(text) ||
      client.lastName.toLowerCase().includes(text) ||
      client.email.toLowerCase().includes(text) ||
      client.phone.includes(text)
    );
  }

  // Guarda cliente
  saveClient() {
    this.showConfirmation = true;

    setTimeout(() => {
      this.showConfirmation = false;
    }, 3000);

    this.resetForm();
  }

  // Activa edición
  editClient(client?: any) {
    this.isEditing = true;

    if (client) {
      this.newClient = { ...client };
    }
  }

  // Elimina cliente
  deleteClient(client?: any) {
    this.showConfirmation = true;

    setTimeout(() => {
      this.showConfirmation = false;
    }, 2000);

    if (client) {
      this.clients = this.clients.filter(c => c !== client);
    }
  }

  // Limpia formulario
  resetForm() {
    this.newClient = {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    };

    this.isEditing = false;
  }

}