import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosService } from '../../services/servicios.service';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent {
  servicio = {
    active: true,
    name: '',
    price: 0,
    description: '',
    durationMinutes: 0
  };

  mensaje: string = '';

  constructor(private serviciosService: ServiciosService) {}

  guardarServicio(): void {
    this.mensaje = '';

    if (!this.servicio.name || !this.servicio.price || !this.servicio.durationMinutes || !this.servicio.description) {
      this.mensaje = 'Completa todos los campos para guardar el servicio.';
      return;
    }

    this.serviciosService.crearServicio(this.servicio).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          this.mensaje = 'Servicio creado con éxito.';
          this.servicio = {
            active: true,
            name: '',
            price: 0,
            description: '',
            durationMinutes: 0
          };
        } else {
          this.mensaje = res?.message || 'No se pudo crear el servicio.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al crear el servicio.';
      }
    });
  }
}