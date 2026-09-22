import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
  data: T;
  status: number;
  successful: boolean;
  message: string;
}

export interface Category {
  id?: number;
  name: string;
  description: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl, this.options());
  }

  createCategory(category: Omit<Category, 'id' | 'active'>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, category, this.options());
  }

  updateCategory(id: number, category: Omit<Category, 'id' | 'active'>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category, this.options());
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, this.options());
  }

  private options(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token || ''}` }) };
  }
}
