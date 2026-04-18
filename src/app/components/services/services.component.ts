import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosService } from '../../services/servicios.service';

interface Service {
  id?: number;
  active: boolean;
  name: string;
  price: number;
  description: string;
  durationMinutes: number;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {

  // Datos del formulario
  service: Service = {
    active: true,
    name: '',
    price: 0,
    description: '',
    durationMinutes: 0
  };

  // Lista de servicios
  services: Service[] = [];

  // Estado de edición
  isEditing = false;
  editServiceId: number | null = null;

  // Mensajes
  message: string = '';

  constructor(private servicesService: ServiciosService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  // Carga servicios
  loadServices(): void {
    this.servicesService.obtenerServicios().subscribe({
      next: (res: any) => {
        this.services = res?.data || res || [];
      },
      error: () => {
        this.services = [];
      }
    });
  }

  // Guarda servicio
  saveService(): void {
    this.message = '';
    this.service.active = true;

    if (!this.service.name || !this.service.price || !this.service.durationMinutes || !this.service.description) {
      this.message = 'Completa todos los campos para guardar el servicio.';
      return;
    }

    if (this.isEditing && this.editServiceId != null) {
      this.updateService();
      return;
    }

    this.servicesService.crearServicio(this.service).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Servicio creado con éxito.';
          const newService = res?.data || this.service;
          this.services.push(newService);
          this.resetForm();
        } else {
          this.message = res?.message || 'No se pudo crear el servicio.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Error al crear el servicio.';
      }
    });
  }

  // Editar servicio
  editService(service: Service): void {
    this.isEditing = true;
    this.editServiceId = service.id ?? null;

    this.service = { ...service };
    this.message = 'Completa los campos y presiona actualizar servicio.';
  }

  // Eliminar servicio
  deleteService(serviceId?: number, serviceName?: string): void {
    if (serviceId == null) {
      this.message = 'No se pudo eliminar el servicio.';
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el servicio "${serviceName}"?`);
    if (!confirmDelete) return;

    this.servicesService.eliminarServicio(serviceId).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.services = this.services.filter(item => item.id !== serviceId);
          this.message = 'Servicio eliminado con éxito.';

          if (this.editServiceId === serviceId) {
            this.resetForm();
          }
        } else {
          this.message = res?.message || 'No se pudo eliminar el servicio.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Error al eliminar el servicio.';
      }
    });
  }

  // Actualizar servicio
  updateService(): void {
    if (this.editServiceId == null) {
      this.message = 'No se seleccionó ningún servicio.';
      return;
    }

    const payload = {
      name: this.service.name,
      description: this.service.description,
      price: this.service.price,
      durationMinutes: this.service.durationMinutes,
      active: true
    };

    this.servicesService.actualizarServicio(this.editServiceId, payload).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Servicio actualizado con éxito.';

          const updated = res?.data || { id: this.editServiceId, ...payload };

          this.services = this.services.map(item =>
            item.id === this.editServiceId ? updated : item
          );

          this.resetForm();
        } else {
          this.message = res?.message || 'No se pudo actualizar el servicio.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Error al actualizar el servicio.';
      }
    });
  }

  // Cancela edición
  cancelEdit(): void {
    this.resetForm();
    this.message = 'Edición cancelada.';
  }

  // Limpia formulario
  private resetForm(): void {
    this.isEditing = false;
    this.editServiceId = null;

    this.service = {
      active: true,
      name: '',
      price: 0,
      description: '',
      durationMinutes: 0
    };
  }

}