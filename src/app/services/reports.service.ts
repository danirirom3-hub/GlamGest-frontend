import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, defer, from, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { OfflineStoreService, StoredReport } from './offline-store.service';

export type ReportType = 'executive' | 'appointments' | 'sales' | 'services' | 'employees';
export type ReportFormat = 'pdf' | 'excel';

export interface ReportDefinition {
  type: ReportType;
  format: ReportFormat;
  title: string;
  description: string;
  fallbackName: string;
}

export interface DownloadedReport {
  blob: Blob;
  fileName: string;
  syncedAt: string;
  fromCache: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient, private offlineStore: OfflineStoreService) {}

  download(definition: ReportDefinition, fromDate: string, toDate: string): Observable<DownloadedReport> {
    const key = definition.type;
    if (!this.offlineStore.isOnline) {
      return defer(() => from(this.offlineStore.getReport(key))).pipe(
        switchMap(cached => cached
          ? from([this.fromStoredReport(cached)])
          : from(Promise.reject(new Error('No hay una copia offline de este reporte. Conéctate primero para descargarlo.'))))
      );
    }

    const params = new HttpParams().set('from', fromDate).set('to', toDate);
    return this.http.get(`${this.apiUrl}/${definition.type}/${definition.format}`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => this.toDownloadedReport(response, definition)),
      switchMap(download => from(this.saveReport(key, download)).pipe(map(() => download)))
    );
  }

  private toDownloadedReport(response: HttpResponse<Blob>, definition: ReportDefinition): DownloadedReport {
    const blob = response.body || new Blob([], { type: response.headers.get('Content-Type') || undefined });
    return {
      blob,
      fileName: this.extractFileName(response, definition),
      syncedAt: new Date().toISOString(),
      fromCache: false
    };
  }

  private async saveReport(key: string, report: DownloadedReport): Promise<void> {
    const stored: StoredReport = {
      key,
      blob: report.blob,
      fileName: report.fileName,
      contentType: report.blob.type,
      syncedAt: report.syncedAt
    };
    await this.offlineStore.saveReport(stored);
  }

  private fromStoredReport(report: StoredReport): DownloadedReport {
    return { blob: report.blob, fileName: report.fileName, syncedAt: report.syncedAt, fromCache: true };
  }

  private extractFileName(response: HttpResponse<Blob>, definition: ReportDefinition): string {
    const contentDisposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition') || '';
    const encoded = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i)?.[1];
    const plain = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
    const candidate = encoded || plain;
    if (candidate) {
      try { return decodeURIComponent(candidate.trim().replace(/^"|"$/g, '')); } catch { return candidate.trim(); }
    }
    return definition.fallbackName;
  }
}
