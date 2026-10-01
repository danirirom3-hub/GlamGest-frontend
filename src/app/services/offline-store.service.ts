import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface StoredReport {
  key: string;
  blob: Blob;
  fileName: string;
  contentType: string;
  syncedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OfflineStoreService {
  private readonly databaseName = 'glam-gest-offline';
  private readonly databaseVersion = 1;
  private readonly onlineSubject = new BehaviorSubject<boolean>(this.readOnlineState());
  readonly online$ = this.onlineSubject.asObservable();
  private databasePromise?: Promise<IDBDatabase>;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onlineSubject.next(true));
      window.addEventListener('offline', () => this.onlineSubject.next(false));
    }
  }

  get isOnline(): boolean { return this.onlineSubject.value; }

  async saveReport(report: StoredReport): Promise<void> {
    await this.put('reports', report.key, report);
  }

  async getReport(key: string): Promise<StoredReport | undefined> {
    return this.get<StoredReport>('reports', key);
  }

  async saveMetrics(value: unknown, from: string, to: string, syncedAt = new Date().toISOString()): Promise<void> {
    await this.put('metrics', 'latest', { value, from, to, syncedAt });
  }

  async getMetrics(): Promise<{ value: unknown; from: string; to: string; syncedAt: string } | undefined> {
    return this.get('metrics', 'latest');
  }

  async saveLastPeriod(from: string, to: string): Promise<void> {
    await this.put('settings', 'last-period', { from, to });
  }

  async getLastPeriod(): Promise<{ from: string; to: string } | undefined> {
    return this.get('settings', 'last-period');
  }

  private readOnlineState(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine;
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB no está disponible en este navegador.'));
        return;
      }
      const request = indexedDB.open(this.databaseName, this.databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        ['reports', 'metrics', 'settings'].forEach(store => {
          if (!database.objectStoreNames.contains(store)) database.createObjectStore(store);
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.databasePromise;
  }

  private async put(storeName: string, key: string, value: unknown): Promise<void> {
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const database = await this.openDatabase();
    return new Promise<T | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }
}
