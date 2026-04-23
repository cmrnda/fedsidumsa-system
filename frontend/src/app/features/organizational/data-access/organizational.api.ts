import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
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

  getPeriods(): Observable<{ data: ManagementPeriod[] }> {
    return this.http.get<{ data: ManagementPeriod[] }>(`${this.baseUrl}/periods`);
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
    );
  }

  getInstances(): Observable<{ data: OrganizationalInstance[] }> {
    return this.http.get<{ data: OrganizationalInstance[] }>(`${this.baseUrl}/instances`);
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
    );
  }

  getPositionGroups(): Observable<{ data: PositionGroup[] }> {
    return this.http.get<{ data: PositionGroup[] }>(`${this.baseUrl}/position-groups`);
  }

  createPositionGroup(payload: {
    name: string;
    description?: string | null;
    is_active: boolean;
  }): Observable<{ message: string; data: PositionGroup }> {
    return this.http.post<{ message: string; data: PositionGroup }>(
      `${this.baseUrl}/position-groups`,
      payload,
    );
  }

  getPositions(): Observable<{ data: Position[] }> {
    return this.http.get<{ data: Position[] }>(`${this.baseUrl}/positions`);
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
    );
  }

  getDocuments(): Observable<{ data: SupportingDocument[] }> {
    return this.http.get<{ data: SupportingDocument[] }>(`${this.baseUrl}/documents`);
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
    );
  }

  getIncompatibilityRules(): Observable<{ data: IncompatibilityRule[] }> {
    return this.http.get<{ data: IncompatibilityRule[] }>(
      `${this.baseUrl}/incompatibility-rules`,
    );
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
    );
  }

  getAppointments(): Observable<{ data: Appointment[] }> {
    return this.http.get<{ data: Appointment[] }>(`${this.baseUrl}/appointments`);
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
    );
  }
}