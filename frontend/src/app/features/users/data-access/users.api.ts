import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SKIP_HTTP_ERROR_NOTIFICATION } from '../../../core/interceptors/http-error.interceptor';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../../../shared/types/pagination.types';
import {
  SystemRole,
  SystemUser,
  SystemUserPasswordPayload,
  SystemUserPayload,
} from '../../../shared/types/user.types';

@Injectable({
  providedIn: 'root',
})
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users/`;

  getUsers(params?: Record<string, string | number | boolean | null | undefined>): Observable<PaginatedResponse<SystemUser>> {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const suffix = searchParams.size ? `?${searchParams.toString()}` : '';
    return this.http.get<PaginatedResponse<SystemUser>>(`${this.baseUrl}${suffix}`);
  }

  getRoles(): Observable<{ data: SystemRole[] }> {
    return this.http.get<{ data: SystemRole[] }>(`${this.baseUrl}roles`);
  }

  createUser(payload: SystemUserPayload): Observable<{ message: string; data: SystemUser }> {
    return this.http.post<{ message: string; data: SystemUser }>(this.baseUrl, payload, {
      context: this.quietContext(),
    });
  }

  updateUser(userId: number, payload: Partial<SystemUserPayload>): Observable<{ message: string; data: SystemUser }> {
    return this.http.put<{ message: string; data: SystemUser }>(`${this.baseUrl}${userId}`, payload, {
      context: this.quietContext(),
    });
  }

  changePassword(userId: number, payload: SystemUserPasswordPayload): Observable<{ message: string; data: SystemUser }> {
    return this.http.put<{ message: string; data: SystemUser }>(`${this.baseUrl}${userId}/password`, payload, {
      context: this.quietContext(),
    });
  }

  private quietContext(): HttpContext {
    return new HttpContext().set(SKIP_HTTP_ERROR_NOTIFICATION, true);
  }
}
