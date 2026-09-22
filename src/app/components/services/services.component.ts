import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { CategoriesService, Category } from '../../services/categories.service';
import { ServicePayload, ServicesService } from '../../services/services.service';

interface Service {
  id?: number;
  active: boolean;
  name: string;
  price: number | null;
  description: string;
  durationMinutes: number | null;
  categoryId: number | null;
  categoryName?: string | null;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  readonly durationOptions = Array.from({ length: 32 }, (_, index) => (index + 1) * 15);

  services: Service[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  statusFilter: 'active' | 'inactive' | 'all' = 'active';
  loading = true;
  savingService = false;
  loadingCategories = false;
  savingCategory = false;
  serviceModalOpen = false;
  categoryModalOpen = false;
  categoryFormOpen = false;
  isEditing = false;
  editServiceId: number | null = null;
  editCategoryId: number | null = null;
  service: Service = this.emptyService();
  private originalService: Service | null = null;
  category: Category = this.emptyCategory();
  durationMenuOpen = false;

  constructor(
    private servicesService: ServicesService,
    private categoriesService: CategoriesService,
    private authService: AuthService
  ) {}

  get isAdmin(): boolean { return this.authService.getRole() === 'ADMIN'; }

  get filteredServices(): Service[] {
    return this.services.filter(service =>
      this.matchesStatus(service) &&
      (this.selectedCategoryId === null || service.categoryId === this.selectedCategoryId)
    );
  }

  get selectedCategoryLabel(): string {
    return this.selectedCategoryId === null
      ? 'Todos los servicios'
      : this.categories.find(category => category.id === this.selectedCategoryId)?.name || 'Servicios';
  }

  get allVisibleServicesCount(): number {
    return this.services.filter(service => this.matchesStatus(service)).length;
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
  }

  categoryServiceCount(categoryId: number): number {
    return this.services.filter(service =>
      service.categoryId === categoryId && this.matchesStatus(service)
    ).length;
  }

  private matchesStatus(service: Service): boolean {
    return this.statusFilter === 'all' || (this.statusFilter === 'active' ? service.active : !service.active);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.servicesService.getAdminServices().subscribe({
      next: response => {
        this.services = this.unwrap(response);
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.showError(error, 'No se pudieron cargar los servicios.');
      }
    });
    this.loadCategories();
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesService.getCategories().subscribe({
      next: response => {
        this.categories = this.unwrap(response).filter(category => category.active !== false);
        this.loadingCategories = false;
      },
      error: error => {
        this.loadingCategories = false;
        this.showError(error, 'No se pudieron cargar las categorías.');
      }
    });
  }

  openNewService(): void {
    this.closeCategoryModal();
    this.isEditing = false;
    this.editServiceId = null;
    this.originalService = null;
    this.service = this.emptyService();
    this.durationMenuOpen = false;
    this.serviceModalOpen = true;
  }

  openEditService(service: Service): void {
    this.closeCategoryModal();
    this.isEditing = true;
    this.editServiceId = service.id ?? null;
    this.service = { ...service, categoryId: service.categoryId ?? null };
    this.originalService = { ...this.service };
    this.durationMenuOpen = false;
    this.serviceModalOpen = true;
  }

  closeServiceModal(): void {
    if (!this.savingService) {
      this.durationMenuOpen = false;
      this.serviceModalOpen = false;
    }
  }

  toggleDurationMenu(): void {
    this.durationMenuOpen = !this.durationMenuOpen;
  }

  selectDuration(duration: number): void {
    this.service.durationMinutes = duration;
    this.durationMenuOpen = false;
  }

  saveService(): void {
    if (!this.service.name.trim() || this.service.price === null || this.service.durationMinutes === null || !this.service.description.trim()) {
      Swal.fire('Campos incompletos', 'Completa nombre, descripción, precio y duración.', 'warning');
      return;
    }
    if (this.service.durationMinutes <= 0 || this.service.durationMinutes % 15 !== 0) {
      Swal.fire('Duración inválida', 'La duración debe estar expresada en bloques de 15 minutos.', 'warning');
      return;
    }
    const payload: ServicePayload | Partial<ServicePayload> = this.isEditing && this.originalService
      ? this.changedServiceFields()
      : {
        name: this.service.name.trim(),
        description: this.service.description.trim(),
        price: this.service.price,
        durationMinutes: this.service.durationMinutes,
        categoryId: this.service.categoryId
      };
    if (this.isEditing && Object.keys(payload).length === 0) {
      this.serviceModalOpen = false;
      return;
    }
    this.savingService = true;
    const request = this.isEditing && this.editServiceId !== null
      ? this.servicesService.updateService(this.editServiceId, payload)
      : this.servicesService.createService(payload as ServicePayload);
    request.subscribe({
      next: response => {
        if (!response?.successful) { this.savingService = false; this.showError(response, 'No se pudo guardar el servicio.'); return; }
        const saved = response.data || { ...payload, active: true, id: this.editServiceId };
        this.services = this.isEditing
          ? this.services.map(item => item.id === this.editServiceId ? { ...item, ...saved } : item)
          : [...this.services, saved];
        this.savingService = false;
        this.serviceModalOpen = false;
        this.originalService = null;
        Swal.fire({ icon: 'success', title: this.isEditing ? 'Servicio actualizado' : 'Servicio creado', timer: 1300, showConfirmButton: false });
      },
      error: error => { this.savingService = false; this.showError(error, 'No se pudo guardar el servicio.'); }
    });
  }

  toggleService(service: Service): void {
    if (!this.isAdmin || !service.id) return;
    const activating = !service.active;
    const action = activating ? 'activar' : 'desactivar';
    Swal.fire({ title: `¿Quieres ${action} "${service.name}"?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar' }).then(result => {
      if (!result.isConfirmed) return;
      const request: Observable<any> = activating
        ? this.servicesService.updateService(service.id!, { active: true })
        : this.servicesService.deleteService(service.id!);
      request.subscribe({
        next: response => {
          if (!response?.successful) { this.showError(response, `No se pudo ${action} el servicio.`); return; }
          this.services = this.services.map(item => item.id === service.id ? { ...item, active: activating } : item);
          Swal.fire({ icon: 'success', title: activating ? 'Servicio activado' : 'Servicio desactivado', timer: 1200, showConfirmButton: false });
        },
        error: error => this.showError(error, `No se pudo ${action} el servicio.`)
      });
    });
  }

  private changedServiceFields(): Partial<ServicePayload> {
    if (!this.originalService) return {};
    const changes: Partial<ServicePayload> = {};
    if (this.service.name.trim() !== this.originalService.name) changes.name = this.service.name.trim();
    if (this.service.description.trim() !== this.originalService.description) changes.description = this.service.description.trim();
    if (this.service.price !== this.originalService.price && this.service.price !== null) changes.price = this.service.price;
    if (this.service.durationMinutes !== this.originalService.durationMinutes && this.service.durationMinutes !== null) changes.durationMinutes = this.service.durationMinutes;
    if (this.service.categoryId !== this.originalService.categoryId) changes.categoryId = this.service.categoryId;
    return changes;
  }

  openCategories(): void {
    if (!this.isAdmin) return;
    this.closeServiceModal();
    this.categoryModalOpen = true;
    this.categoryFormOpen = false;
    this.loadCategories();
  }

  closeCategoryModal(): void {
    this.categoryModalOpen = false;
    this.categoryFormOpen = false;
  }

  newCategory(): void {
    this.editCategoryId = null;
    this.category = this.emptyCategory();
    this.categoryFormOpen = true;
  }

  editCategory(category: Category): void {
    this.editCategoryId = category.id ?? null;
    this.category = { ...category };
    this.categoryFormOpen = true;
  }

  cancelCategoryForm(): void {
    this.categoryFormOpen = false;
    this.editCategoryId = null;
  }

  saveCategory(): void {
    if (!this.category.name.trim()) {
      Swal.fire('Campo incompleto', 'Ingresa el nombre de la categoría.', 'warning');
      return;
    }
    const payload = { name: this.category.name.trim(), description: this.category.description.trim() };
    const editingCategory = this.editCategoryId !== null;
    this.savingCategory = true;
    const request = this.editCategoryId !== null
      ? this.categoriesService.updateCategory(this.editCategoryId, payload)
      : this.categoriesService.createCategory(payload);
    request.subscribe({
      next: response => {
        if (!response?.successful) { this.savingCategory = false; this.showError(response, 'No se pudo guardar la categoría.'); return; }
        const saved = response.data || { ...payload, id: this.editCategoryId, active: true };
        this.categories = this.editCategoryId === null
          ? [...this.categories, saved]
          : this.categories.map(item => item.id === this.editCategoryId ? { ...item, ...saved } : item);
        this.savingCategory = false;
        this.categoryFormOpen = false;
        this.editCategoryId = null;
        Swal.fire({ icon: 'success', title: editingCategory ? 'Categoría actualizada' : 'Categoría creada', timer: 1200, showConfirmButton: false });
      },
      error: error => { this.savingCategory = false; this.showError(error, 'No se pudo guardar la categoría.'); }
    });
  }

  deactivateCategory(category: Category): void {
    if (!category.id) return;
    Swal.fire({ title: `¿Desactivar "${category.name}"?`, text: 'Los servicios existentes conservarán su categoría.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626' }).then(result => {
      if (!result.isConfirmed) return;
      this.categoriesService.deleteCategory(category.id!).subscribe({
        next: response => {
          if (!response?.successful) { this.showError(response, 'No se pudo desactivar la categoría.'); return; }
          this.categories = this.categories.filter(item => item.id !== category.id);
          if (this.selectedCategoryId === category.id) this.selectedCategoryId = null;
          Swal.fire({ icon: 'success', title: 'Categoría desactivada', timer: 1200, showConfirmButton: false });
        },
        error: error => this.showError(error, 'No se pudo desactivar la categoría.')
      });
    });
  }

  categoryName(service: Service): string { return service.categoryName || this.categories.find(item => item.id === service.categoryId)?.name || 'Sin categoría'; }

  formatPrice(price: number | null): string { return price === null ? '-' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price); }

  private emptyService(): Service { return { active: true, name: '', price: null, description: '', durationMinutes: null, categoryId: null }; }
  private emptyCategory(): Category { return { name: '', description: '' }; }
  private unwrap<T>(response: { data: T } | T): T { return (response && typeof response === 'object' && 'data' in response ? response.data : response) as T; }
  private showError(error: any, fallback: string): void { Swal.fire('Error', error?.error?.message || error?.message || fallback, 'error'); }
}
