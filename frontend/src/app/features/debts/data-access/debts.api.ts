import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SKIP_HTTP_ERROR_NOTIFICATION } from '../../../core/interceptors/http-error.interceptor';
import { PaginatedResponse } from '../../../shared/types/pagination.types';
import {
  DebtDashboardSummary,
  ObligationConcept,
  TeacherClearance,
  TeacherObligation,
  TeacherStatement,
} from '../../../shared/types/debt.types';

@Injectable({
  providedIn: 'root',
})
export class DebtsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/debts`;

  getConcepts(): Observable<{ data: ObligationConcept[] }> {
    return this.http.get<{ data: ObligationConcept[] }>(`${this.baseUrl}/concepts`);
  }

  createConcept(payload: {
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
  }): Observable<{ message: string; data: ObligationConcept }> {
    return this.http.post<{ message: string; data: ObligationConcept }>(`${this.baseUrl}/concepts`, payload, {
      context: this.quietContext(),
    });
  }

  getObligations(filters?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<TeacherObligation>> {
    let params = new HttpParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedResponse<TeacherObligation>>(`${this.baseUrl}/obligations`, { params });
  }

  createObligation(payload: {
    teacher_id: number;
    concept_id: number;
    reference_label?: string | null;
    total_amount: number;
    due_date?: string | null;
    observation?: string | null;
  }): Observable<{ message: string; data: TeacherObligation }> {
    return this.http.post<{ message: string; data: TeacherObligation }>(`${this.baseUrl}/obligations`, payload, {
      context: this.quietContext(),
    });
  }

  addPayment(
    obligationId: number,
    payload: {
      amount: number;
      payment_date: string;
      reference?: string | null;
      observation?: string | null;
    },
  ): Observable<{ message: string; data: TeacherObligation }> {
    return this.http.post<{ message: string; data: TeacherObligation }>(
      `${this.baseUrl}/obligations/${obligationId}/payments`,
      payload,
      { context: this.quietContext() },
    );
  }

  getStatement(teacherId: number): Observable<{ data: TeacherStatement }> {
    return this.http.get<{ data: TeacherStatement }>(`${this.baseUrl}/teachers/${teacherId}/statement`, {
      context: this.quietContext(),
    });
  }

  getClearance(teacherId: number): Observable<{ data: TeacherClearance }> {
    return this.http.get<{ data: TeacherClearance }>(`${this.baseUrl}/teachers/${teacherId}/clearance`);
  }

  getDashboardSummary(): Observable<{ data: DebtDashboardSummary }> {
    return this.http.get<{ data: DebtDashboardSummary }>(`${this.baseUrl}/dashboard-summary`);
  }

  private quietContext(): HttpContext {
    return new HttpContext().set(SKIP_HTTP_ERROR_NOTIFICATION, true);
  }
}
