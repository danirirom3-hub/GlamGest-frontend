import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/services.service';
import Swal from 'sweetalert2';

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

  get filteredServices(): Service[] {
    return this.showOnlyActive
      ? this.services.filter(s => s.active)
      : this.services;
  }

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
        Swal.fire('Error', err?.error?.message || 'Error al cargar los servicios.', 'error');
      }
    });
  }

  saveService(): void {
    this.service.active = true;

    if (!this.service.name || !this.service.price || !this.service.durationMinutes || !this.service.description) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos.', 'warning');
      return;
    }

    if (this.isEditing && this.editServiceId != null) {
      this.updateService();
      return;
    }

    this.servicesService.createService(this.service).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          const newService = res?.data || this.service;
          this.services.push(newService);

          Swal.fire({
            icon: 'success',
            title: 'Servicio creado',
            showConfirmButton: false,
            timer: 1500
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo crear el servicio.', 'error');
        }
      },
      error: (err: any) => {
        Swal.fire('Error', err?.error?.message || 'Error al crear el servicio.', 'error');
      }
    });
  }

  editService(service: Service): void {
    this.isEditing = true;
    this.editServiceId = service.id ?? null;
    this.service = { ...service };

    Swal.fire({
      icon: 'info',
      title: 'Editando servicio',
      text: `Ahora estás editando "${service.name}"`,
      timer: 1200,
      showConfirmButton: false
    });
  }

  toggleActive(service: Service): void {

    if (!service.id) {
      Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
      return;
    }

    Swal.fire({
      title: service.active
        ? `¿Desactivar "${service.name}"?`
        : `¿Activar "${service.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (!result.isConfirmed) return;

      const payload = {
        ...service,
        active: !service.active
      };

      this.servicesService.updateService(service.id!, payload).subscribe({
        next: (res: any) => {
          if (res?.successful) {

            this.services = this.services.map(item =>
              item.id === service.id ? { ...item, active: !item.active } : item
            );

            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: service.active
                ? 'Servicio desactivado'
                : 'Servicio activado',
              timer: 1200,
              showConfirmButton: false
            });

          } else {
            Swal.fire('Error', res?.message || 'No se pudo actualizar el estado.', 'error');
          }
        },
        error: () => {
          Swal.fire('Error', 'Error al cambiar el estado.', 'error');
        }
      });

    });
  }

  updateService(): void {
    if (this.editServiceId == null) {
      Swal.fire('Error', 'No hay un servicio seleccionado.', 'error');
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

          const updated = res?.data || { id: this.editServiceId, ...payload };

          this.services = this.services.map(item =>
            item.id === this.editServiceId ? updated : item
          );

          Swal.fire({
            icon: 'success',
            title: 'Servicio actualizado',
            showConfirmButton: false,
            timer: 1500
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo actualizar el servicio.', 'error');
        }
      },
      error: (err: any) => {
        Swal.fire('Error', err?.error?.message || 'Error al actualizar el servicio.', 'error');
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();

    Swal.fire({
      icon: 'info',
      title: 'Edición cancelada',
      timer: 1000,
      showConfirmButton: false
    });
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

  deleteService(service: Service): void {

    if (!service.id) {
      Swal.fire('Error', 'No se pudo eliminar el servicio.', 'error');
      return;
    }

    Swal.fire({
      title: `¿Eliminar "${service.name}"?`,
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (result.isConfirmed) {

        this.servicesService.deleteService(service.id!).subscribe({
          next: (res: any) => {
            if (res?.successful) {

              this.services = this.services.filter(s => s.id !== service.id);

              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Servicio eliminado correctamente',
                timer: 1500,
                showConfirmButton: false
              });

            } else {
              Swal.fire('Error', res?.message || 'No se pudo eliminar.', 'error');
            }
          },
          error: () => {
            Swal.fire('Error', 'Error al eliminar el servicio.', 'error');
          }
        });

      }

    });
  }
}