import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService } from '../../services/employees.service';
import Swal from 'sweetalert2';

  /* Datos que representan a un empleado. */
interface Employee {
  id: number;
  name: string;
  phone: string;
  active: boolean;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {

  /* Valores utilizados por el formulario de empleados. */
  employee: Employee = {
    id: 0,
    name: '',
    phone: '',
    active: true
  };

  /* Empleados cargados desde la API. */
  employees: Employee[] = [];

  /* Estado actual de la pantalla. */
  showOnlyActive = false;
  isEditing = false;
  mensaje = '';

  constructor(private employeesService: EmployeesService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  /* Devuelve los empleados según el filtro seleccionado. */
  get visibleEmployees(): Employee[] {
    return this.showOnlyActive
      ? this.employees.filter(emp => emp.active)
      : this.employees;
  }

  /* Carga los empleados disponibles desde la API. */
  loadEmployees(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res?.data || res || [];
      },
      error: () => {
        this.employees = [];
        Swal.fire('Error', 'Error al cargar los empleados.', 'error');
      }
    });
  }

  /* Crea un empleado o actualiza el que está seleccionado. */
  onSubmit(): void {
    this.mensaje = '';

    if (!this.employee.name || !this.employee.phone) {
      Swal.fire('Campos incompletos', 'Completa todos los campos antes de guardar.', 'warning');
      return;
    }

    if (this.isEditing) {
      this.updateEmployee();
      return;
    }

    this.employeesService.createEmployee({
      name: this.employee.name,
      phone: this.employee.phone
    }).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          this.employees.push(res.data);

          Swal.fire({
            icon: 'success',
            title: 'Empleado creado',
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo crear el empleado.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Error al crear el empleado.', 'error');
      }
    });
  }

  /* Carga los datos del empleado en el formulario de edición. */
  onEdit(emp: Employee): void {
    this.isEditing = true;
    this.employee = {
      id: emp.id,
      name: emp.name,
      phone: emp.phone,
      active: emp.active
    };

    Swal.fire({
      icon: 'info',
      title: 'Editando empleado',
      text: `Estás editando a "${emp.name}"`,
      timer: 1200,
      showConfirmButton: false
    });
  }

  /* Actualiza los datos del empleado seleccionado. */
  updateEmployee(): void {
    this.employeesService.updateEmployee(this.employee.id, {
      name: this.employee.name,
      phone: this.employee.phone
    }).subscribe({
      next: (res: any) => {
        if (res?.successful) {

          const updated = res.data;

          this.employees = this.employees.map(emp =>
            emp.id === updated.id ? updated : emp
          );

          Swal.fire({
            icon: 'success',
            title: 'Empleado actualizado',
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire('Error', res?.message || 'No se pudo actualizar el empleado.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Error al actualizar el empleado.', 'error');
      }
    });
  }

  /* Desactiva el empleado seleccionado. */
  onDelete(id: number): void {

    Swal.fire({
      title: '¿Eliminar empleado?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.employeesService.deleteEmployee(id).subscribe({
        next: () => {

          this.employees = this.employees.filter(emp => emp.id !== id);

          Swal.fire({
            icon: 'success',
            title: 'Empleado eliminado',
            timer: 1200,
            showConfirmButton: false
          });

          if (this.isEditing && this.employee.id === id) {
            this.resetForm();
          }
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'Error al eliminar el empleado.', 'error');
        }
      });

    });
  }

  /* Cancela la edición y limpia el formulario. */
  onCancel(): void {
    this.resetForm();

    Swal.fire({
      icon: 'info',
      title: 'Edición cancelada',
      timer: 1000,
      showConfirmButton: false
    });
  }

  /* Restablece los valores iniciales del formulario. */
  resetForm(): void {
    this.isEditing = false;
    this.employee = {
      id: 0,
      name: '',
      phone: '',
      active: true
    };
    this.mensaje = '';
  }

  /* Cambia el estado activo del empleado. */
  toggleActive(emp: Employee): void {

    Swal.fire({
      title: emp.active
        ? `¿Desactivar a "${emp.name}"?`
        : `¿Activar a "${emp.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.employeesService.updateEmployee(emp.id, {
        ...emp,
        active: !emp.active
      }).subscribe({
        next: (res: any) => {
          if (res?.successful) {

            this.employees = this.employees.map(e =>
              e.id === emp.id ? { ...e, active: !e.active } : e
            );

            Swal.fire({
              icon: 'success',
              title: emp.active ? 'Empleado desactivado' : 'Empleado activado',
              timer: 1200,
              showConfirmButton: false
            });

          } else {
            Swal.fire('Error', res?.message || 'No se pudo cambiar el estado.', 'error');
          }
        },
        error: () => {
          Swal.fire('Error', 'Error al cambiar estado.', 'error');
        }
      });

    });
  }
}
