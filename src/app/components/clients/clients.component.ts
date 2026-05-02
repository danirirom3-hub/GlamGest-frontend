import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Client {
  id?: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent {

  /* 🔥 modelo del formulario */
  client: Client = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  };

  /* 🔥 datos vienen del backend */
  clients: Client[] = [];

  /* 🔥 estado UI */
  searchText: string = '';
  isEditing: boolean = false;
  showConfirmation: boolean = false;

  /* ========================= */
  /* 🎯 EVENTOS (solo UI) */
  /* ========================= */

  onSubmit(): void {
    console.log('submit', this.client);
    this.showTempMessage();
    this.resetForm();
  }

  onEdit(client: Client): void {
    console.log('edit', client);
    this.client = { ...client };
    this.isEditing = true;
  }

  onDelete(client: Client): void {
    console.log('delete', client);
    this.showTempMessage();
  }

  onNew(): void {
    this.resetForm();
    this.isEditing = false;
  }

  /* ========================= */
  /* 🔄 UI helpers */
  /* ========================= */

  resetForm(): void {
    this.client = {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    };
  }

  showTempMessage(): void {
    this.showConfirmation = true;
    setTimeout(() => this.showConfirmation = false, 2000);
  }
}