import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosService } from '../../services/servicios.service';

interface Servicio {
  id?: number;
  active: boolean;
  name: string;
  price: number;
  description: string;
  durationMinutes: number;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit {
  servicio: Servicio = {
    active: true,
    name: '',
    price: 0,
    description: '',
    durationMinutes: 0
  };

  servicios: Servicio[] = [];
  editing = false;
  editServiceId: number | null = null;
  mensaje: string = '';

  constructor(private serviciosService: ServiciosService) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.serviciosService.obtenerServicios().subscribe({
      next: (res: any) => {
        this.servicios = res?.data || res || [];
      },
      error: () => {
        this.servicios = [];
      }
    });
  }

  guardarServicio(): void {
    this.mensaje = '';
    this.servicio.active = true;

    if (!this.servicio.name || !this.servicio.price || !this.servicio.durationMinutes || !this.servicio.description) {
      this.mensaje = 'Completa todos los campos para guardar el servicio.';
      return;
    }

    if (this.editing && this.editServiceId != null) {
      this.actualizarServicio();
      return;
    }

    this.serviciosService.crearServicio(this.servicio).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Servicio creado con éxito.';
          const nuevo = res?.data || this.servicio;
          this.servicios.push(nuevo);
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo crear el servicio.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al crear el servicio.';
      }
    });
  }

  editarServicio(servicio: Servicio): void {
    this.editing = true;
    this.editServiceId = servicio.id ?? null;
    this.servicio = {
      active: true,
      name: servicio.name,
      price: servicio.price,
      description: servicio.description,
      durationMinutes: servicio.durationMinutes,
      id: servicio.id
    };
    this.mensaje = 'Completa los campos y presiona actualizar servicio.';
  }

  eliminarServicio(servicioId: number | undefined, servicioName: string): void {
    if (servicioId == null) {
      this.mensaje = 'No se pudo eliminar el servicio.';
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de eliminar el servicio "${servicioName}"?`);
    if (!confirmar) {
      return;
    }

    this.serviciosService.eliminarServicio(servicioId).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.servicios = this.servicios.filter((item) => item.id !== servicioId);
          this.mensaje = 'Servicio eliminado con éxito.';

          if (this.editServiceId === servicioId) {
            this.resetForm();
          }
        } else {
          this.mensaje = res?.message || 'No se pudo eliminar el servicio.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al eliminar el servicio.';
      }
    });
  }

  actualizarServicio(): void {
    if (this.editServiceId == null) {
      this.mensaje = 'No se seleccionó ningún servicio para editar.';
      return;
    }

    this.servicio.active = true;

    const updatePayload = {
      name: this.servicio.name,
      description: this.servicio.description,
      price: this.servicio.price,
      durationMinutes: this.servicio.durationMinutes,
      active: true
    };

    this.serviciosService.actualizarServicio(this.editServiceId, updatePayload).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Servicio actualizado con éxito.';
          const actualizado = res?.data || { id: this.editServiceId, ...updatePayload };
          this.servicios = this.servicios.map((item) =>
            item.id === this.editServiceId ? actualizado : item
          );
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo actualizar el servicio.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al actualizar el servicio.';
      }
    });
  }

  cancelarEdicion(): void {
    this.resetForm();
    this.mensaje = 'Edición cancelada.';
  }

  private resetForm(): void {
    this.editing = false;
    this.editServiceId = null;
    this.servicio = {
      active: true,
      name: '',
      price: 0,
      description: '',
      durationMinutes: 0
    };
  }
}