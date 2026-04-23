import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AvailableSigner,
  CertifiableEvent,
  Certificate,
  CertificateHistoryItem,
  CertificateTemplate,
  CertificateType,
  EventParticipation,
} from '../../../shared/types/certificate.types';

@Injectable({
  providedIn: 'root',
})
export class CertificatesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/certificates`;

  getTypes(): Observable<{ data: CertificateType[] }> {
    return this.http.get<{ data: CertificateType[] }>(`${this.baseUrl}/types`);
  }

  createType(payload: {
    code: string;
    name: string;
    description?: string | null;
    requires_event: boolean;
    is_active: boolean;
  }): Observable<{ message: string; data: CertificateType }> {
    return this.http.post<{ message: string; data: CertificateType }>(`${this.baseUrl}/types`, payload);
  }

  getTemplates(): Observable<{ data: CertificateTemplate[] }> {
    return this.http.get<{ data: CertificateTemplate[] }>(`${this.baseUrl}/templates`);
  }

  createTemplate(payload: {
    certificate_type_id: number;
    name: string;
    header_text?: string | null;
    body_template: string;
    footer_text?: string | null;
    is_active: boolean;
  }): Observable<{ message: string; data: CertificateTemplate }> {
    return this.http.post<{ message: string; data: CertificateTemplate }>(`${this.baseUrl}/templates`, payload);
  }

  getEvents(): Observable<{ data: CertifiableEvent[] }> {
    return this.http.get<{ data: CertifiableEvent[] }>(`${this.baseUrl}/events`);
  }

  createEvent(payload: {
    name: string;
    description?: string | null;
    location?: string | null;
    start_date: string;
    end_date?: string | null;
    status: string;
    supporting_document_id?: number | null;
  }): Observable<{ message: string; data: CertifiableEvent }> {
    return this.http.post<{ message: string; data: CertifiableEvent }>(`${this.baseUrl}/events`, payload);
  }

  getParticipations(): Observable<{ data: EventParticipation[] }> {
    return this.http.get<{ data: EventParticipation[] }>(`${this.baseUrl}/participations`);
  }

  createParticipation(payload: {
    teacher_id: number;
    event_id: number;
    role_name?: string | null;
    participation_type?: string;
    status: string;
    observation?: string | null;
  }): Observable<{ message: string; data: EventParticipation }> {
    return this.http.post<{ message: string; data: EventParticipation }>(`${this.baseUrl}/participations`, payload);
  }

  getAvailableSigners(date?: string): Observable<{ data: AvailableSigner[] }> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<{ data: AvailableSigner[] }>(`${this.baseUrl}/available-signers`, { params });
  }

  getCertificates(filters?: Record<string, string | number | null | undefined>): Observable<{ data: Certificate[] }> {
    let params = new HttpParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<{ data: Certificate[] }>(this.baseUrl, { params });
  }

  getCertificate(id: number): Observable<{ data: Certificate }> {
    return this.http.get<{ data: Certificate }>(`${this.baseUrl}/${id}`);
  }

  createCertificate(payload: {
    teacher_id: number;
    certificate_type_id: number;
    template_id: number;
    event_id?: number | null;
    participation_id?: number | null;
    purpose?: string | null;
    observation?: string | null;
    signer_ids: Array<{ appointment_id: number; order_index: number; label_override?: string | null }>;
    status?: string;
  }): Observable<{ message: string; data: Certificate }> {
    return this.http.post<{ message: string; data: Certificate }>(this.baseUrl, payload);
  }

  updateCertificate(
    id: number,
    payload: {
      template_id?: number;
      event_id?: number | null;
      participation_id?: number | null;
      purpose?: string | null;
      observation?: string | null;
      signer_ids?: Array<{ appointment_id: number; order_index: number; label_override?: string | null }>;
    },
  ): Observable<{ message: string; data: Certificate }> {
    return this.http.put<{ message: string; data: Certificate }>(`${this.baseUrl}/${id}`, payload);
  }

  getHistory(id: number): Observable<{ data: CertificateHistoryItem[] }> {
    return this.http.get<{ data: CertificateHistoryItem[] }>(`${this.baseUrl}/${id}/history`);
  }

  changeStatus(id: number, action: 'request' | 'review' | 'approve' | 'reject' | 'issue' | 'deliver' | 'cancel', reason?: string) {
    return this.http.post<{ message: string; data: Certificate }>(`${this.baseUrl}/${id}/${action}`, reason ? { reason } : {});
  }
}
