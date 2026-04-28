import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SKIP_HTTP_ERROR_NOTIFICATION } from '../../../core/interceptors/http-error.interceptor';
import { PaginatedResponse } from '../../../shared/types/pagination.types';
import { Teacher, TeacherPayload } from '../../../shared/types/teacher.types';

@Injectable({
  providedIn: 'root',
})
export class TeachersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teachers/`;

  getAll(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<Teacher>> {
    let searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const suffix = searchParams.size ? `?${searchParams.toString()}` : '';
    return this.http.get<PaginatedResponse<Teacher>>(`${this.baseUrl}${suffix}`);
  }

  create(payload: TeacherPayload): Observable<{ message: string; data: Teacher }> {
    return this.http.post<{ message: string; data: Teacher }>(this.baseUrl, payload, {
      context: this.quietContext(),
    });
  }

  private quietContext(): HttpContext {
    return new HttpContext().set(SKIP_HTTP_ERROR_NOTIFICATION, true);
  }
}
