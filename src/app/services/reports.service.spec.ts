import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService } from './reports.service';
import { OfflineStoreService } from './offline-store.service';
import { environment } from '../../environments/environment';

describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;
  let offlineStore: jasmine.SpyObj<OfflineStoreService>;
  const definition = { type: 'sales' as const, format: 'excel' as const, title: 'Ventas', description: '', fallbackName: 'detalle-ventas.xlsx' };

  beforeEach(() => {
    offlineStore = jasmine.createSpyObj('OfflineStoreService', ['saveReport', 'getReport'], { isOnline: true });
    offlineStore.saveReport.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [ReportsService, provideHttpClient(), provideHttpClientTesting(), { provide: OfflineStoreService, useValue: offlineStore }]
    });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('construye la URL, envía from/to y descarga el Blob con su nombre', () => {
    const blob = new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    service.download(definition, '2026-01-01', '2026-01-31').subscribe(result => {
      expect(result.blob).toBe(blob);
      expect(result.fileName).toBe('ventas-enero.xlsx');
      expect(result.fromCache).toBeFalse();
      expect(offlineStore.saveReport).toHaveBeenCalledWith(jasmine.objectContaining({
        key: 'sales:excel:2026-01-01:2026-01-31',
        type: 'sales', format: 'excel', from: '2026-01-01', to: '2026-01-31'
      }));
    });

    const request = http.expectOne(request => request.url === `${environment.apiUrl}/reports/sales/excel`);
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.get('to')).toBe('2026-01-31');
    expect(request.request.responseType).toBe('blob');
    request.flush(blob, { headers: { 'Content-Disposition': 'attachment; filename="ventas-enero.xlsx"' } });
  });

  it('usa una copia IndexedDB cuando no hay conexión', () => {
    Object.defineProperty(offlineStore, 'isOnline', { value: false });
    offlineStore.getReport.and.resolveTo({ key: 'sales:excel:2026-01-01:2026-01-31', type: 'sales', format: 'excel', from: '2026-01-01', to: '2026-01-31', blob: new Blob(['old']), fileName: 'ventas.xlsx', contentType: 'application/octet-stream', syncedAt: '2026-01-02T10:00:00Z' });

    service.download(definition, '2026-01-01', '2026-01-31').subscribe(result => {
      expect(result.fromCache).toBeTrue();
      expect(result.fileName).toBe('ventas.xlsx');
      expect(result.from).toBe('2026-01-01');
      expect(result.to).toBe('2026-01-31');
    });
  });

  it('no devuelve la copia de otro período y muestra un error offline', () => {
    Object.defineProperty(offlineStore, 'isOnline', { value: false });
    offlineStore.getReport.and.resolveTo(undefined);

    service.download(definition, '2026-02-01', '2026-02-28').subscribe({
      next: () => fail('No debía devolver una copia de otro período'),
      error: error => expect(error.message).toBe('No existe una copia offline para este período. Conéctate para descargarla.')
    });

    expect(offlineStore.getReport).toHaveBeenCalledWith('sales:excel:2026-02-01:2026-02-28');
  });
});
