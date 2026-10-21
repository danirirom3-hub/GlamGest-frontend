import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService } from '../../services/employees.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiErrorMapper } from '../../services/api-error.mapper';

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
  imports: [CommonModule, FormsModule, TranslateModule],
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

  constructor(
    private employeesService: EmployeesService,
    private translate: TranslateService,
    private errorMapper: ApiErrorMapper
  ) {}

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
        Swal.fire(this.translate.instant('common.error'), this.translate.instant('employees.loadError'), 'error');
      }
    });
  }

  /* Crea un empleado o actualiza el que está seleccionado. */
  onSubmit(): void {
    this.mensaje = '';

    if (!this.employee.name || !this.employee.phone) {
      Swal.fire(this.translate.instant('common.error'), this.translate.instant('employees.incomplete'), 'warning');
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
            title: this.translate.instant('employees.created'),
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire(this.translate.instant('common.error'), this.errorMapper.localize(res?.message, 'employees.createError'), 'error');
        }
      },
      error: (err) => {
        Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(err, this.translate.instant('employees.createError')), 'error');
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
      title: this.translate.instant('employees.editingTitle'),
      text: this.translate.instant('employees.editingText', { name: emp.name }),
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
            title: this.translate.instant('employees.updated'),
            timer: 1500,
            showConfirmButton: false
          });

          this.resetForm();

        } else {
          Swal.fire(this.translate.instant('common.error'), this.errorMapper.localize(res?.message, 'employees.updateError'), 'error');
        }
      },
      error: (err) => {
        Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(err, this.translate.instant('employees.updateError')), 'error');
      }
    });
  }

  /* Desactiva el empleado seleccionado. */
  onDelete(id: number): void {

    Swal.fire({
      title: this.translate.instant('employees.deleteTitle'),
      text: this.translate.instant('employees.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yesDelete'),
      cancelButtonText: this.translate.instant('common.cancel'),
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.employeesService.deleteEmployee(id).subscribe({
        next: () => {

          this.employees = this.employees.filter(emp => emp.id !== id);

          Swal.fire({
            icon: 'success',
            title: this.translate.instant('employees.deleted'),
            timer: 1200,
            showConfirmButton: false
          });

          if (this.isEditing && this.employee.id === id) {
            this.resetForm();
          }
        },
        error: (err) => {
          Swal.fire(this.translate.instant('common.error'), this.errorMapper.resolve(err, this.translate.instant('employees.deleteError')), 'error');
        }
      });

    });
  }

  /* Cancela la edición y limpia el formulario. */
  onCancel(): void {
    this.resetForm();

    Swal.fire({
      icon: 'info',
      title: this.translate.instant('employees.cancelTitle'),
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
      title: this.translate.instant(
        emp.active ? 'employees.toggleDeactivateQuestion' : 'employees.toggleActivateQuestion',
        { name: emp.name }
      ),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.yes'),
      cancelButtonText: this.translate.instant('common.cancel')
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
              title: this.translate.instant(emp.active ? 'employees.deactivated' : 'employees.activated'),
              timer: 1200,
              showConfirmButton: false
            });

          } else {
            Swal.fire(this.translate.instant('common.error'), this.errorMapper.localize(res?.message, 'employees.statusError'), 'error');
          }
        },
        error: () => {
          Swal.fire(this.translate.instant('common.error'), this.translate.instant('employees.statusChangeError'), 'error');
        }
      });

    });
  }
}
