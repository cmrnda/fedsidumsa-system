import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Teacher, TeacherPayload } from '../../../shared/types/teacher.types';

@Injectable({
  providedIn: 'root',
})
export class TeachersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teachers`;

  getAll(): Observable<{ data: Teacher[] }> {
    return this.http.get<{ data: Teacher[] }>(this.baseUrl);
  }

  create(payload: TeacherPayload): Observable<{ message: string; data: Teacher }> {
    return this.http.post<{ message: string; data: Teacher }>(this.baseUrl, payload);
  }
}