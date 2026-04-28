import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SKIP_HTTP_ERROR_NOTIFICATION } from '../../../core/interceptors/http-error.interceptor';
import {
  PublicCertificateRequestResult,
  PublicCertificateStatus,
  PublicCertificateType,
  PublicCertificateValidation,
} from '../../../shared/types/certificate.types';

@Injectable({
  providedIn: 'root',
})
export class PublicCertificatesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public/certificates`;

  getTypes(): Observable<{ data: PublicCertificateType[] }> {
    return this.http.get<{ data: PublicCertificateType[] }>(`${this.baseUrl}/types`);
  }

  requestCertificate(payload: {
    certificate_type_code: string;
    ci: string;
    ci_extension?: string | null;
    purpose?: string | null;
  }): Observable<{ message: string; data: PublicCertificateRequestResult }> {
    return this.http.post<{ message: string; data: PublicCertificateRequestResult }>(
      `${this.baseUrl}/request`,
      payload,
      { context: this.quietContext() },
    );
  }

  getStatus(payload: {
    request_number: string;
    ci: string;
    ci_extension?: string | null;
  }): Observable<{ data: PublicCertificateStatus }> {
    return this.http.post<{ data: PublicCertificateStatus }>(`${this.baseUrl}/status`, payload, {
      context: this.quietContext(),
    });
  }

  validateCertificate(payload: {
    request_number: string;
    ci: string;
    ci_extension?: string | null;
  }): Observable<{ data: PublicCertificateValidation }> {
    return this.http.post<{ data: PublicCertificateValidation }>(
      `${this.baseUrl}/validate`,
      payload,
      { context: this.quietContext() },
    );
  }

  private quietContext(): HttpContext {
    return new HttpContext().set(SKIP_HTTP_ERROR_NOTIFICATION, true);
  }
}
