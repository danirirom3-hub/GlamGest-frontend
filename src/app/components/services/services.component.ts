import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/services.service';

interface Service {
  id?: number;
  active: boolean;
  name: string;
  price: number | null;
  description: string;
  durationMinutes: number | null;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {

  service: Service = {
    active: true,
    name: '',
    price: null,
    description: '',
    durationMinutes: null
  };

  services: Service[] = [];

  isEditing = false;
  editServiceId: number | null = null;

  message: string = '';

  showOnlyActive: boolean = true;

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  // filtro de activos
  get filteredServices(): Service[] {
    return this.showOnlyActive
      ? this.services.filter(s => s.active)
      : this.services;
  }

  // toggle del filtro completo
  toggleFiltro(): void {
    this.showOnlyActive = !this.showOnlyActive;
  }

  loadServices(): void {
    this.servicesService.getServices().subscribe({
      next: (res: any) => {
        this.services = res?.data || res || [];
      },
      error: (err: any) => {
        this.services = [];
        this.message = err?.error?.message || 'Error al cargar los servicios.';
      }
    });
  }

  saveService(): void {
    this.message = '';
    this.service.active = true;

    if (!this.service.name || !this.service.price || !this.service.durationMinutes || !this.service.description) {
      this.message = 'Por favor completa todos los campos.';
      return;
    }

    if (this.isEditing && this.editServiceId != null) {
      this.updateService();
      return;
    }

    this.servicesService.createService(this.service).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Servicio creado correctamente.';
          const newService = res?.data || this.service;
          this.services.push(newService);
          this.resetForm();
        } else {
          this.message = res?.message || 'No se pudo crear el servicio.';
        }
      },
      error: (err: any) => {
        this.message = err?.error?.message || 'Error al crear el servicio.';
      }
    });
  }

  editService(service: Service): void {
    this.isEditing = true;
    this.editServiceId = service.id ?? null;
    this.service = { ...service };
    this.message = 'Editando servicio...';
  }

  // borrado lógico
  toggleActive(service: Service): void {

    if (!service.id) {
      this.message = 'No se pudo actualizar el estado.';
      return;
    }

    const confirmAction = window.confirm(
      service.active
        ? `¿Desactivar el servicio "${service.name}"?`
        : `¿Activar el servicio "${service.name}"?`
    );

    if (!confirmAction) return;

    const payload = {
      ...service,
      active: !service.active
    };

    this.servicesService.updateService(service.id, payload).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          this.services = this.services.map(item =>
            item.id === service.id ? { ...item, active: !item.active } : item
          );

          this.message = service.active
            ? 'Servicio desactivado correctamente.'
            : 'Servicio activado correctamente.';

        } else {
          this.message = res?.message || 'No se pudo actualizar el estado.';
        }
      },
      error: () => {
        this.message = 'Error al cambiar el estado.';
      }
    });
  }

  updateService(): void {
    if (this.editServiceId == null) {
      this.message = 'No hay un servicio seleccionado.';
      return;
    }

    const payload = {
      name: this.service.name,
      description: this.service.description,
      price: this.service.price,
      durationMinutes: this.service.durationMinutes,
      active: true
    };

    this.servicesService.updateService(this.editServiceId, payload).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Servicio actualizado correctamente.';

          const updated = res?.data || { id: this.editServiceId, ...payload };

          this.services = this.services.map(item =>
            item.id === this.editServiceId ? updated : item
          );

          this.resetForm();
        } else {
          this.message = res?.message || 'No se pudo actualizar el servicio.';
        }
      },
      error: (err: any) => {
        this.message = err?.error?.message || 'Error al actualizar el servicio.';
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.message = 'Edición cancelada.';
  }

  private resetForm(): void {
    this.isEditing = false;
    this.editServiceId = null;

    this.service = {
      active: true,
      name: '',
      price: null,
      description: '',
      durationMinutes: null
    };
  }
}