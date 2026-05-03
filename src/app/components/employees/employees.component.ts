import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService } from '../../services/employees.service';

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

  /* 🔥 modelo del formulario */
  employee: Employee = {
    id: 0,
    name: '',
    phone: '',
    active: true
  };

  /* 🔥 datos vienen del backend */
  employees: Employee[] = [];

  /* 🔥 estado visual */
  showOnlyActive = false;
  isEditing = false;
  mensaje = '';

  constructor(private employeesService: EmployeesService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  get visibleEmployees(): Employee[] {
    return this.showOnlyActive ? this.employees.filter(emp => emp.active) : this.employees;
  }

  loadEmployees(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res?.data || res || [];
      },
      error: () => {
        this.employees = [];
        this.mensaje = 'Error al cargar los empleados.';
      }
    });
  }

  onSubmit(): void {
    this.mensaje = '';

    if (!this.employee.name || !this.employee.phone) {
      this.mensaje = 'Completa todos los campos antes de guardar.';
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
          this.mensaje = 'Empleado creado con éxito.';
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo crear el empleado.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al crear el empleado.';
      }
    });
  }

  onEdit(emp: Employee): void {
    this.isEditing = true;
    this.employee = {
      id: emp.id,
      name: emp.name,
      phone: emp.phone,
      active: emp.active
    };
    this.mensaje = 'Modifica los campos y presiona actualizar empleado.';
  }

  updateEmployee(): void {
    this.employeesService.updateEmployee(this.employee.id, {
      name: this.employee.name,
      phone: this.employee.phone
    }).subscribe({
      next: (res: any) => {
        if (res?.successful) {
          const updated = res.data;
          this.employees = this.employees.map(emp => emp.id === updated.id ? updated : emp);
          this.mensaje = 'Empleado actualizado con éxito.';
          this.resetForm();
        } else {
          this.mensaje = res?.message || 'No se pudo actualizar el empleado.';
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al actualizar el empleado.';
      }
    });
  }

  onDelete(id: number): void {
    const confirmar = window.confirm('¿Estás seguro de eliminar este empleado?');
    if (!confirmar) {
      return;
    }

    this.employeesService.deleteEmployee(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(emp => emp.id !== id);
        this.mensaje = 'Empleado eliminado con éxito.';

        if (this.isEditing && this.employee.id === id) {
          this.resetForm();
        }
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'Error al eliminar el empleado.';
      }
    });
  }

  onCancel(): void {
    this.resetForm();
  }

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
}