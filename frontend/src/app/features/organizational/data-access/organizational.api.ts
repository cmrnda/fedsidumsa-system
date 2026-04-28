import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SKIP_HTTP_ERROR_NOTIFICATION } from '../../../core/interceptors/http-error.interceptor';
import { PaginatedResponse } from '../../../shared/types/pagination.types';
import {
  Appointment,
  IncompatibilityRule,
  ManagementPeriod,
  OrganizationalInstance,
  Position,
  PositionGroup,
  SupportingDocument,
} from '../../../shared/types/organization.types';

@Injectable({
  providedIn: 'root',
})
export class OrganizationalApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/organizational`;

  getPeriods(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<ManagementPeriod>> {
    return this.http.get<PaginatedResponse<ManagementPeriod>>(`${this.baseUrl}/periods`, {
      params: this.buildParams(params),
    });
  }

  createPeriod(payload: {
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    observation?: string | null;
  }): Observable<{ message: string; data: ManagementPeriod }> {
    return this.http.post<{ message: string; data: ManagementPeriod }>(
      `${this.baseUrl}/periods`,
      payload,
      { context: this.quietContext() },
    );
  }

  getInstances(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<OrganizationalInstance>> {
    return this.http.get<PaginatedResponse<OrganizationalInstance>>(`${this.baseUrl}/instances`, {
      params: this.buildParams(params),
    });
  }

  createInstance(payload: {
    code: string;
    name: string;
    level: string;
    instance_type: string;
    is_active: boolean;
  }): Observable<{ message: string; data: OrganizationalInstance }> {
    return this.http.post<{ message: string; data: OrganizationalInstance }>(
      `${this.baseUrl}/instances`,
      payload,
      { context: this.quietContext() },
    );
  }

  getPositionGroups(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<PositionGroup>> {
    return this.http.get<PaginatedResponse<PositionGroup>>(`${this.baseUrl}/position-groups`, {
      params: this.buildParams(params),
    });
  }

  createPositionGroup(payload: {
    name: string;
    description?: string | null;
    is_active: boolean;
  }): Observable<{ message: string; data: PositionGroup }> {
    return this.http.post<{ message: string; data: PositionGroup }>(
      `${this.baseUrl}/position-groups`,
      payload,
      { context: this.quietContext() },
    );
  }

  getPositions(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<Position>> {
    return this.http.get<PaginatedResponse<Position>>(`${this.baseUrl}/positions`, {
      params: this.buildParams(params),
    });
  }

  createPosition(payload: {
    instance_id: number;
    position_group_id: number;
    name: string;
    is_exclusive: boolean;
    is_active: boolean;
  }): Observable<{ message: string; data: Position }> {
    return this.http.post<{ message: string; data: Position }>(
      `${this.baseUrl}/positions`,
      payload,
      { context: this.quietContext() },
    );
  }

  getDocuments(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<SupportingDocument>> {
    return this.http.get<PaginatedResponse<SupportingDocument>>(`${this.baseUrl}/documents`, {
      params: this.buildParams(params),
    });
  }

  createDocument(payload: {
    document_type: string;
    document_number?: string | null;
    document_date?: string | null;
    description?: string | null;
    file_path?: string | null;
    file_hash?: string | null;
    observation?: string | null;
  }): Observable<{ message: string; data: SupportingDocument }> {
    return this.http.post<{ message: string; data: SupportingDocument }>(
      `${this.baseUrl}/documents`,
      payload,
      { context: this.quietContext() },
    );
  }

  getIncompatibilityRules(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<IncompatibilityRule>> {
    return this.http.get<PaginatedResponse<IncompatibilityRule>>(`${this.baseUrl}/incompatibility-rules`, {
      params: this.buildParams(params),
    });
  }

  createIncompatibilityRule(payload: {
    origin_group_id: number;
    target_group_id: number;
    reason?: string | null;
    is_active: boolean;
  }): Observable<{ message: string; data: IncompatibilityRule }> {
    return this.http.post<{ message: string; data: IncompatibilityRule }>(
      `${this.baseUrl}/incompatibility-rules`,
      payload,
      { context: this.quietContext() },
    );
  }

  getAppointments(params?: Record<string, string | number | null | undefined>): Observable<PaginatedResponse<Appointment>> {
    return this.http.get<PaginatedResponse<Appointment>>(`${this.baseUrl}/appointments`, {
      params: this.buildParams(params),
    });
  }

  createAppointment(payload: {
    teacher_id: number;
    period_id: number;
    position_id: number;
    start_date: string;
    end_date?: string | null;
    status: string;
    is_signer: boolean;
    supporting_document_id?: number | null;
    observation?: string | null;
  }): Observable<{ message: string; data: Appointment }> {
    return this.http.post<{ message: string; data: Appointment }>(
      `${this.baseUrl}/appointments`,
      payload,
      { context: this.quietContext() },
    );
  }

  private quietContext(): HttpContext {
    return new HttpContext().set(SKIP_HTTP_ERROR_NOTIFICATION, true);
  }

  private buildParams(params?: Record<string, string | number | null | undefined>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
