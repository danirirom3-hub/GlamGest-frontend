import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/services.service';

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

  service: Service = {
    active: true,
    name: '',
    price: 0,
    description: '',
    durationMinutes: 0
  };

  services: Service[] = [];

  isEditing = false;
  editServiceId: number | null = null;

  message: string = '';

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.servicesService.getServices().subscribe({
      next: (res: any) => {
        this.services = res?.data || res || [];
      },
      error: (err: any) => {
        this.services = [];
      }
    });
  }

  saveService(): void {
    this.message = '';
    this.service.active = true;

    if (!this.service.name || !this.service.price || !this.service.durationMinutes || !this.service.description) {
      this.message = 'Please fill all fields.';
    }

    if (this.isEditing && this.editServiceId != null) {
      this.updateService();
      return;
    }

    this.servicesService.createService(this.service).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.message = 'Service created successfully.';
          const newService = res?.data || this.service;
          this.services.push(newService);
          this.resetForm();
        } else {
          this.message = res?.message || 'Could not create service.';
        }
      },
      error: (err: any) => {
        this.message = err?.error?.message || 'Error creating service.';
      }
    });
  }

  editService(service: Service): void {
    this.isEditing = true;
    this.editServiceId = service.id ?? null;

    this.service = { ...service };
    this.message = 'Editing service...';
  }

  deleteService(serviceId?: number, serviceName?: string): void {
    if (serviceId == null) {
      this.message = 'Could not delete service.';
      return;
    }

    const confirmDelete = window.confirm(`Delete service "${serviceName}"?`);
    if (!confirmDelete) return;

    this.servicesService.deleteService(serviceId).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.services = this.services.filter(item => item.id !== serviceId);
          this.message = 'Service deleted successfully.';

          if (this.editServiceId === serviceId) {
            this.resetForm();
          }
        } else {
          this.message = res?.message || 'Could not delete service.';
        }
      },
      error: (err: any) => {
        this.message = err?.error?.message || 'Error deleting service.';
      }
    });
  }

  updateService(): void {
    if (this.editServiceId == null) {
      this.message = 'No service selected.';
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
          this.message = 'Service updated successfully.';

          const updated = res?.data || { id: this.editServiceId, ...payload };

          this.services = this.services.map(item =>
            item.id === this.editServiceId ? updated : item
          );

          this.resetForm();
        } else {
          this.message = res?.message || 'Could not update service.';
        }
      },
      error: (err: any) => {
        this.message = err?.error?.message || 'Error updating service.';
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.message = 'Edit cancelled.';
  }

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