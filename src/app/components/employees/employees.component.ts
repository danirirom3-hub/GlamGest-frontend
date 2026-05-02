import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class EmployeesComponent {

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

  /* ========================= */
  /* 🎯 EVENTOS (sin lógica) */
  /* ========================= */

  onSubmit(): void {
    console.log('submit', this.employee);
  }

  onEdit(emp: Employee): void {
    console.log('edit', emp);
  }

  onDelete(id: number): void {
    console.log('delete', id);
  }

  onCancel(): void {
    this.resetForm();
  }

  /* ========================= */
  /* 🔄 UTILIDAD UI */
  /* ========================= */

  resetForm(): void {
    this.employee = {
      id: 0,
      name: '',
      phone: '',
      active: true
    };
  }
}