import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ClientsService, Client } from '../../services/clients.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ApiErrorMapper } from '../../services/api-error.mapper';

interface ClientGroup {
  letter: string;
  clients: Client[];
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule, LocalizedDatePipe],
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

  constructor(private clientsService: ClientsService, private translate: TranslateService, private errorMapper: ApiErrorMapper) {
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
        void Swal.fire(this.translate.instant('common.error'), this.translate.instant('clients.loadError'), 'error');
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
      void Swal.fire(this.translate.instant('common.error'), this.translate.instant('clients.incomplete'), 'warning');
      return;
    }
    if (this.isEditing && this.editClientId != null) {
      this.updateClient();
      return;
    }
    this.clientsService.createClient(this.client).subscribe({
      next: response => {
        if (!response.successful) { this.showError(this.errorMapper.localize(response.message, 'clients.createError')); return; }
        this.closeModal();
        this.loadClients();
        void Swal.fire({ icon: 'success', title: this.translate.instant('clients.created'), timer: 1200, showConfirmButton: false });
      },
      error: error => this.showApiError(error, this.translate.instant('clients.createError'))
    });
  }

  updateClient(): void {
    if (this.editClientId == null) return;
    this.clientsService.updateClient(this.editClientId, this.client).subscribe({
      next: response => {
        if (!response.successful) { this.showError(this.errorMapper.localize(response.message, 'clients.updateError')); return; }
        this.closeModal();
        this.loadClients();
        void Swal.fire({ icon: 'success', title: this.translate.instant('clients.updated'), timer: 1200, showConfirmButton: false });
      },
      error: error => this.showApiError(error, this.translate.instant('clients.updateError'))
    });
  }

  onDelete(client: Client): void {
    if (client.id == null) return;
    void Swal.fire({
      title: this.translate.instant('clients.deactivateQuestion', { name: client.name }),
      text: this.translate.instant('clients.deactivateDescription'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesDeactivate'),
      cancelButtonText: this.translate.instant('common.cancel'),
      confirmButtonColor: '#d33'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.clientsService.deleteClient(client.id!).subscribe({
        next: () => {
          this.loadClients();
          if (this.editClientId === client.id) this.closeModal();
          void Swal.fire({ icon: 'success', title: this.translate.instant('clients.deactivated'), timer: 1200, showConfirmButton: false });
        },
        error: error => this.showApiError(error, this.translate.instant('clients.deactivateError'))
      });
    });
  }

  private resetForm(): void {
    this.isEditing = false;
    this.editClientId = null;
    this.client = this.emptyClient();
  }

  private emptyClient(): Client { return { name: '', email: '', phone: '' }; }

  private showError(message: string): void { void Swal.fire(this.translate.instant('common.error'), message, 'error'); }

  private showApiError(error: any, fallback: string): void {
    this.showError(this.errorMapper.resolve(error, fallback));
  }
}
