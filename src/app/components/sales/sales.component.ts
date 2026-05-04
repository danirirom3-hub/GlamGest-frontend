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

  // controla la vista actual (registro o historial)
  view: 'create' | 'history' = 'create';

  // datos generales (pendientes de integración completa con backend)
  sales: any[] = [];
  clients: any[] = [];
  services: any[] = [];
  employees: any[] = [];

  // items actuales de la venta
  items: any[] = [];

  // id de la venta seleccionada para mostrar detalle
  activeSale: number | null = null;

  ngOnInit() {
    // suscripción a los items del servicio de caja
    this.cashService.items$.subscribe(data => {
      this.items = data;
    });
  }

  // agrega un servicio manualmente desde la lista
  addService(service: any) {
    const item = {
      service: service.name,
      price: service.price,
      source: 'manual'
    };

    this.cashService.addManualItem(item);
  }

  // elimina un item por índice
  removeService(index: number) {
    this.cashService.removeItem(index);
  }

  // calcula el total de la venta
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  // muestra u oculta el detalle de una venta
  toggleDetail(id: number) {
    this.activeSale = this.activeSale === id ? null : id;
  }
}