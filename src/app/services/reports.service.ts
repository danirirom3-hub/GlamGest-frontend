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
  type: ReportType;
  format: ReportFormat;
  from: string;
  to: string;
  contentType: string;
  syncedAt: string;
  fromCache: boolean;
}

export function reportCacheKey(definition: { type: string; format: string }, from: string, to: string): string {
  return `${definition.type}:${definition.format}:${from}:${to}`;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient, private offlineStore: OfflineStoreService) {}

  download(definition: ReportDefinition, fromDate: string, toDate: string): Observable<DownloadedReport> {
    const key = reportCacheKey(definition, fromDate, toDate);
    if (!this.offlineStore.isOnline) {
      return defer(() => from(this.offlineStore.getReport(key))).pipe(
        switchMap(cached => cached
          ? from([this.fromStoredReport(cached)])
          : from(Promise.reject(new Error('No existe una copia offline para este período. Conéctate para descargarla.'))))
      );
    }

    const params = new HttpParams().set('from', fromDate).set('to', toDate);
    return this.http.get(`${this.apiUrl}/${definition.type}/${definition.format}`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => this.toDownloadedReport(response, definition, fromDate, toDate)),
      switchMap(download => from(this.saveReport(key, download, fromDate, toDate)).pipe(map(() => ({ ...download, from: fromDate, to: toDate }))))
    );
  }

  private toDownloadedReport(response: HttpResponse<Blob>, definition: ReportDefinition, from: string, to: string): DownloadedReport {
    const blob = response.body || new Blob([], { type: response.headers.get('Content-Type') || undefined });
    return {
      blob,
      fileName: this.extractFileName(response, definition),
      type: definition.type,
      format: definition.format,
      from,
      to,
      contentType: blob.type || response.headers.get('Content-Type') || 'application/octet-stream',
      syncedAt: new Date().toISOString(),
      fromCache: false
    };
  }

  private async saveReport(key: string, report: DownloadedReport, from: string, to: string): Promise<void> {
    const stored: StoredReport = {
      key,
      type: report.type,
      format: report.format,
      from,
      to,
      blob: report.blob,
      fileName: report.fileName,
      contentType: report.contentType,
      syncedAt: report.syncedAt
    };
    await this.offlineStore.saveReport(stored);
  }

  private fromStoredReport(report: StoredReport): DownloadedReport {
    return {
      blob: report.blob,
      fileName: report.fileName,
      type: report.type as ReportType,
      format: report.format as ReportFormat,
      from: report.from,
      to: report.to,
      contentType: report.contentType,
      syncedAt: report.syncedAt,
      fromCache: true
    };
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
