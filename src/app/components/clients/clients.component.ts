import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientsService } from '../../services/clients.service';

interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  registrationDate?: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {

  /* 🔥 modelo del formulario */
  client: Client = {
    name: '',
    email: '',
    phone: ''
  };

  /* 🔥 datos vienen del backend */
  clients: Client[] = [];

  /* 🔥 estado UI */
  searchText: string = '';
  isEditing: boolean = false;
  editClientId: number | null = null;
  mensaje: string = '';

  constructor(private clientsService: ClientsService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clientsService.getClients().subscribe({
      next: (res: any) => {
        this.clients = res?.data || res || [];
      },
      error: () => {
        this.clients = [];
      }
    });
  }

  onSubmit(): void {
    this.mensaje = '';

    if (!this.client.name || !this.client.email || !this.client.phone) {
      this.mensaje = 'Completa todos los campos para guardar el cliente.';
      return;
    }

    if (this.isEditing && this.editClientId != null) {
      this.actualizarCliente();
      return;
    }

    this.clientsService.createClient(this.client).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Cliente creado con éxito.';
          const nuevo = res?.data || this.client;
          this.clients.push(nuevo);
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo crear el cliente.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al crear el cliente.';
      }
    });
  }

  onEdit(client: Client): void {
    this.isEditing = true;
    this.editClientId = client.id ?? null;
    this.client = {
      name: client.name,
      email: client.email,
      phone: client.phone
    };
    this.mensaje = 'Completa los campos y presiona actualizar cliente.';
  }

  onDelete(client: Client): void {
    if (client.id == null) {
      this.mensaje = 'No se pudo eliminar el cliente.';
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de eliminar al cliente "${client.name}"?`);
    if (!confirmar) {
      return;
    }

    this.clientsService.deleteClient(client.id).subscribe({
      next: () => {
        this.clients = this.clients.filter((item) => item.id !== client.id);
        this.mensaje = 'Cliente eliminado con éxito.';

        if (this.editClientId === client.id) {
          this.resetForm();
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al eliminar el cliente.';
      }
    });
  }

  onNew(): void {
    this.resetForm();
    this.isEditing = false;
  }

  actualizarCliente(): void {
    if (this.editClientId == null) {
      this.mensaje = 'No se seleccionó ningún cliente para editar.';
      return;
    }

    this.clientsService.updateClient(this.editClientId, this.client).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Cliente actualizado con éxito.';
          const actualizado = res?.data || { id: this.editClientId, ...this.client };
          this.clients = this.clients.map((item) =>
            item.id === this.editClientId ? actualizado : item
          );
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo actualizar el cliente.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al actualizar el cliente.';
      }
    });
  }

  /* ========================= */
  /* 🔄 UI helpers */
  /* ========================= */

  resetForm(): void {
    this.isEditing = false;
    this.editClientId = null;
    this.client = {
      name: '',
      email: '',
      phone: ''
    };
  }
}