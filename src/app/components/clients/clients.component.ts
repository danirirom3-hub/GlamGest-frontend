import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ClientsService, Client } from '../../services/clients.service';
import Swal from 'sweetalert2';

interface ClientGroup {
  letter: string;
  clients: Client[];
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  client: Client = this.emptyClient();
  searchText = '';
  sort = 'recent';
  page = 0;
  size = 25;
  totalItems = 0;
  totalPages = 0;
  loading = false;
  modalOpen = false;
  isEditing = false;
  editClientId: number | null = null;
  private readonly searchSubject = new Subject<string>();

  constructor(private clientsService: ClientsService) {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.loadClients();
    });
  }

  get groupedClients(): ClientGroup[] {
    if (!this.sort.startsWith('name')) return [{ letter: '', clients: this.clients }];
    const groups = new Map<string, Client[]>();
    this.clients.forEach(client => {
      const letter = (client.name.trim().charAt(0) || '#').toUpperCase();
      const group = groups.get(letter) || [];
      group.push(client);
      groups.set(letter, group);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, clients]) => ({ letter, clients }));
  }

  ngOnInit(): void { this.loadClients(); }

  loadClients(): void {
    this.loading = true;
    this.clientsService.getClients(this.searchText, this.sort, this.page, this.size).subscribe({
      next: response => {
        this.clients = response.data.items;
        this.totalItems = response.data.totalItems;
        this.totalPages = response.data.totalPages;
        this.page = response.data.page;
        this.loading = false;
      },
      error: () => {
        this.clients = [];
        this.loading = false;
        void Swal.fire('Error', 'No se pudieron cargar los clientes.', 'error');
      }
    });
  }

  onSearchChange(): void { this.searchSubject.next(this.searchText); }

  onSortChange(): void {
    this.page = 0;
    this.loadClients();
  }

  previousPage(): void {
    if (this.page === 0) return;
    this.page--;
    this.loadClients();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page++;
    this.loadClients();
  }

  openNew(): void {
    this.resetForm();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.resetForm();
  }

  onEdit(client: Client): void {
    this.isEditing = true;
    this.editClientId = client.id ?? null;
    this.client = { ...client };
    this.modalOpen = true;
  }

  onSubmit(): void {
    if (!this.client.name.trim() || !this.client.email.trim() || !this.client.phone.trim()) {
      void Swal.fire('Campos incompletos', 'Completa todos los campos para guardar el cliente.', 'warning');
      return;
    }
    if (this.isEditing && this.editClientId != null) {
      this.updateClient();
      return;
    }
    this.clientsService.createClient(this.client).subscribe({
      next: response => {
        if (!response.successful) { this.showError(response.message); return; }
        this.closeModal();
        this.loadClients();
        void Swal.fire({ icon: 'success', title: 'Cliente creado', timer: 1200, showConfirmButton: false });
      },
      error: error => this.showApiError(error, 'No se pudo crear el cliente.')
    });
  }

  updateClient(): void {
    if (this.editClientId == null) return;
    this.clientsService.updateClient(this.editClientId, this.client).subscribe({
      next: response => {
        if (!response.successful) { this.showError(response.message); return; }
        this.closeModal();
        this.loadClients();
        void Swal.fire({ icon: 'success', title: 'Cliente actualizado', timer: 1200, showConfirmButton: false });
      },
      error: error => this.showApiError(error, 'No se pudo actualizar el cliente.')
    });
  }

  onDelete(client: Client): void {
    if (client.id == null) return;
    void Swal.fire({
      title: `¿Desactivar a "${client.name}"?`,
      text: 'El cliente se conservará en el historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.clientsService.deleteClient(client.id!).subscribe({
        next: () => {
          this.loadClients();
          if (this.editClientId === client.id) this.closeModal();
          void Swal.fire({ icon: 'success', title: 'Cliente desactivado', timer: 1200, showConfirmButton: false });
        },
        error: error => this.showApiError(error, 'No se pudo desactivar el cliente.')
      });
    });
  }

  private resetForm(): void {
    this.isEditing = false;
    this.editClientId = null;
    this.client = this.emptyClient();
  }

  private emptyClient(): Client { return { name: '', email: '', phone: '' }; }

  private showError(message: string): void { void Swal.fire('Error', message, 'error'); }

  private showApiError(error: any, fallback: string): void {
    this.showError(error?.error?.error || error?.error?.message || error?.message || fallback);
  }
}
