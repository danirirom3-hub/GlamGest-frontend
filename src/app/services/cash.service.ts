import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashService {

  private itemsSubject = new BehaviorSubject<any[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {}

  // 👉 Desde citas
  addItemFromAppointment(appointment: any) {
    const item = {
      client: appointment.client,
      service: appointment.service,
      price: appointment.price,
      source: 'appointment'
    };

    this.itemsSubject.next([...this.itemsSubject.value, item]);
  }

  // 👉 Desde caja (extras)
  addManualItem(item: any) {
    this.itemsSubject.next([...this.itemsSubject.value, item]);
  }

  removeItem(index: number) {
    const updated = this.itemsSubject.value.filter((_, i) => i !== index);
    this.itemsSubject.next(updated);
  }

  clear() {
    this.itemsSubject.next([]);
  }
}