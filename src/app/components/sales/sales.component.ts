import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {

  view: 'create' | 'history' = 'create';

  sales: any[] = [];
  clients: any[] = [];
  services: any[] = [];
  employees: any[] = [];

  selectedServices: any[] = [];

  activeSale: number | null = null;

  addService(service: any) {
    this.selectedServices.push(service);
  }

  removeService(index: number) {
    this.selectedServices.splice(index, 1);
  }

  toggleDetail(id: number) {
    this.activeSale = this.activeSale === id ? null : id;
  }
}