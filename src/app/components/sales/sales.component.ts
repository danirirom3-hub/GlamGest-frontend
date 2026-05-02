import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashService } from '../../services/cash.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent {

  constructor(private cashService: CashService) {}

  view: 'create' | 'history' = 'create';

  sales: any[] = [];
  clients: any[] = [];
  services: any[] = [];
  employees: any[] = [];

  items: any[] = [];

  activeSale: number | null = null;

  ngOnInit() {
    this.cashService.items$.subscribe(data => {
      this.items = data;
    });
  }

  // 👉 agregar manual (desde tabla)
  addService(service: any) {
    const item = {
      service: service.name,
      price: service.price,
      source: 'manual'
    };

    this.cashService.addManualItem(item);
  }

  removeService(index: number) {
    this.cashService.removeItem(index);
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  toggleDetail(id: number) {
    this.activeSale = this.activeSale === id ? null : id;
  }
}