import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BackupInfo {
  id: string;
  createdAt: string;
  size: number;
  sha256: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class BackupsService {
  private readonly apiUrl = `${environment.apiUrl}/backups`;

  constructor(private http: HttpClient) {}

  list(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(this.apiUrl);
  }

  create(): Observable<BackupInfo> {
    return this.http.post<BackupInfo>(this.apiUrl, {});
  }

  download(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  restore(id: string): Observable<BackupInfo> {
    return this.http.post<BackupInfo>(`${this.apiUrl}/${id}/restore`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
