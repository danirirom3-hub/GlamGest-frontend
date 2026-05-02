import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent {

  employee = {
    id: 0,
    name: '',
    phone: '',
    active: true
  };

  employees = [
    { id: 1, name: 'John Doe', phone: '123456789', active: true },
    { id: 2, name: 'Jane Smith', phone: '987654321', active: false }
  ];

  showOnlyActive = false;

  get filteredEmployees() {
    return this.showOnlyActive
      ? this.employees.filter(e => e.active)
      : this.employees;
  }

  toggleFilter() {
    this.showOnlyActive = !this.showOnlyActive;
  }

  saveEmployee() {
    console.log('Save clicked');
  }

  editEmployee(emp: any) {
    console.log('Edit:', emp);
  }

  deleteEmployee(id: number) {
    console.log('Delete:', id);
  }

  resetForm() {
    this.employee = {
      id: 0,
      name: '',
      phone: '',
      active: true
    };
  }
}