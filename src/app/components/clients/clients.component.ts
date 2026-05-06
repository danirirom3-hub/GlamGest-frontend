import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientsService } from '../../services/clients.service';
import Swal from 'sweetalert2';

/* Modelo de cliente */
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

  /* Datos del formulario */
  client: Client = {
    name: '',
    email: '',
    phone: ''
  };

  /* Lista de clientes */
  clients: Client[] = [];

  /* Estado de la UI */
  searchText: string = '';
  isEditing: boolean = false;
  editClientId: number | null = null;
  mensaje: string = '';

  constructor(private clientsService: ClientsService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  /* Obtener clientes del backend */
  cargarClientes(): void {
    this.clientsService.getClients().subscribe({
      next: (res: any) => {
        this.clients = res?.data || res || [];
      },
      error: () => {
        this.clients = [];
        Swal.fire('Error', 'No se pudieron cargar los clientes.', 'error');
      }
    });
  }

  /* Crear o actualizar cliente */
  onSubmit(): void {
    this.mensaje = '';

    if (!this.client.name || !this.client.email || !this.client.phone) {
      Swal.fire('Campos incompletos', 'Completa todos los campos para guardar el cliente.', 'warning');
      return;
    }

    if (this.isEditing && this.editClientId != null) {
      this.actualizarCliente();
      return;
    }

    this.clientsService.createClient(this.client).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          const nuevo = res?.data || this.client;
          this.clients.push(nuevo);

          Swal.fire({
            icon: 'success',
            title: 'Cliente creado',
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo crear el cliente.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Error al crear el cliente.', 'error');
      }
    });
  }

  /* Cargar cliente en el formulario para editar */
  onEdit(client: Client): void {
    this.isEditing = true;
    this.editClientId = client.id ?? null;
    this.client = {
      name: client.name,
      email: client.email,
      phone: client.phone
    };

    Swal.fire({
      icon: 'info',
      title: 'Editando cliente',
      text: `Estás editando a "${client.name}"`,
      timer: 1200,
      showConfirmButton: false
    });
  }

  /* Eliminar cliente */
  onDelete(client: Client): void {
    if (client.id == null) {
      Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error');
      return;
    }

    Swal.fire({
      title: `¿Eliminar a "${client.name}"?`,
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.clientsService.deleteClient(client.id!).subscribe({ // 🔥 CORREGIDO AQUÍ
        next: () => {

          this.clients = this.clients.filter((item) => item.id !== client.id);

          Swal.fire({
            icon: 'success',
            title: 'Cliente eliminado',
            timer: 1200,
            showConfirmButton: false
          });

          if (this.editClientId === client.id) {
            this.resetForm();
          }
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'Error al eliminar el cliente.', 'error');
        }
      });

    });
  }

  /* Preparar formulario para nuevo cliente */
  onNew(): void {
    this.resetForm();
    this.isEditing = false;

    Swal.fire({
      icon: 'info',
      title: 'Nuevo cliente',
      timer: 1000,
      showConfirmButton: false
    });
  }

  /* Actualizar cliente existente */
  actualizarCliente(): void {
    if (this.editClientId == null) {
      Swal.fire('Error', 'No se seleccionó ningún cliente para editar.', 'error');
      return;
    }

    this.clientsService.updateClient(this.editClientId, this.client).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          const actualizado = res?.data || { id: this.editClientId, ...this.client };

          this.clients = this.clients.map((item) =>
            item.id === this.editClientId ? actualizado : item
          );

          Swal.fire({
            icon: 'success',
            title: 'Cliente actualizado',
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo actualizar el cliente.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Error al actualizar el cliente.', 'error');
      }
    });
  }

  /* Reset del formulario */
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