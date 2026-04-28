import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PublicCertificatesApi } from '../../data-access/public-certificates.api';
import {
  PublicCertificateRequestResult,
  PublicCertificateStatus,
  PublicCertificateType,
  PublicCertificateValidation,
} from '../../../../shared/types/certificate.types';
import { formatApiError, formatDate } from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';

@Component({
  selector: 'app-public-certificates-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InlineAlertComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <ui-page-header
          eyebrow="Consulta pública"
          title="Certificados FEDSIDUMSA"
          description="Esta área pública solo permite consultar estado, validar certificados emitidos y solicitar los tipos habilitados para atención externa."
        >
          <a
            header-actions
            routerLink="/login"
            class="app-button-secondary"
          >
            <span class="material-symbols-rounded text-[18px]">login</span>
            Ingreso administrativo
          </a>
        </ui-page-header>

        <div class="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <ui-section-card
            title="Solicitar certificado público"
            description="Solo se muestran tipos habilitados para solicitud externa. Otros certificados, como no adeudo, siguen un flujo interno."
            icon="post_add"
          >
            <form [formGroup]="requestForm" (ngSubmit)="submitRequest()" class="grid gap-4">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Tipo de certificado</span>
                <select formControlName="certificate_type_code" class="app-field">
                  <option value="">Seleccione un tipo</option>
                  @for (item of publicTypes(); track item.code) {
                    <option [value]="item.code">{{ item.name }}</option>
                  }
                </select>
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">CI</span>
                  <input formControlName="ci" type="text" class="app-field" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-semibold text-slate-700">Extensión</span>
                  <input formControlName="ci_extension" type="text" placeholder="Opcional" class="app-field" />
                </label>
              </div>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Motivo</span>
                <input formControlName="purpose" type="text" placeholder="Uso o finalidad del certificado" class="app-field" />
              </label>

              @if (requestError()) {
                <ui-inline-alert tone="danger" title="No se pudo registrar la solicitud" [message]="requestError()" />
              }

              @if (requestResult()) {
                <ui-inline-alert
                  tone="success"
                  title="Solicitud registrada"
                  [message]="'Número de solicitud: ' + requestResult()!.request_number"
                />
              }

              <button type="submit" [disabled]="requestForm.invalid || loadingRequest()" class="app-button-primary">
                {{ loadingRequest() ? 'Enviando...' : 'Solicitar certificado' }}
              </button>
            </form>
          </ui-section-card>

          <div class="space-y-6">
            <ui-section-card
              title="Consultar estado"
              description="Verifique si una solicitud fue recibida, revisada, emitida o entregada."
              icon="query_stats"
            >
              <form [formGroup]="lookupForm" (ngSubmit)="submitStatus()" class="grid gap-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="block sm:col-span-2">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Número de solicitud</span>
                    <input formControlName="request_number" type="text" class="app-field" />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">CI</span>
                    <input formControlName="ci" type="text" class="app-field" />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Extensión</span>
                    <input formControlName="ci_extension" type="text" placeholder="Opcional" class="app-field" />
                  </label>
                </div>

                @if (lookupError()) {
                  <ui-inline-alert tone="danger" title="No se pudo consultar la solicitud" [message]="lookupError()" />
                }

                @if (statusResult()) {
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{{ statusResult()!.request_number }}</p>
                        <h3 class="mt-2 text-xl font-bold text-slate-950">{{ statusResult()!.certificate_type_name }}</h3>
                      </div>
                      <ui-status-badge [label]="statusResult()!.public_status" [tone]="statusTone(statusResult()!.status)" />
                    </div>
                    <p class="mt-4 text-sm leading-6 text-slate-600">{{ statusResult()!.message }}</p>
                    <p class="mt-3 text-xs text-slate-500">Registrado: {{ formatDateLabel(statusResult()!.created_at.slice(0, 10)) }}</p>
                  </div>
                }

                <button type="submit" [disabled]="lookupForm.invalid || loadingStatus()" class="app-button-secondary">
                  {{ loadingStatus() ? 'Consultando...' : 'Consultar estado' }}
                </button>
              </form>
            </ui-section-card>

            <ui-section-card
              title="Validar certificado emitido"
              description="Compruebe si un certificado ya fue emitido válidamente por el sistema."
              icon="verified"
            >
              <button type="button" (click)="submitValidation()" [disabled]="lookupForm.invalid || loadingValidation()" class="app-button-primary">
                {{ loadingValidation() ? 'Validando...' : 'Validar certificado' }}
              </button>

              @if (validationError()) {
                <div class="mt-4">
                  <ui-inline-alert tone="danger" title="No se pudo validar el certificado" [message]="validationError()" />
                </div>
              }

              @if (validationResult()) {
                <div class="mt-4 rounded-2xl border p-5" [class.border-emerald-200]="validationResult()!.is_valid" [class.bg-emerald-50]="validationResult()!.is_valid" [class.border-amber-200]="!validationResult()!.is_valid" [class.bg-amber-50]="!validationResult()!.is_valid">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{{ validationResult()!.request_number }}</p>
                      <h3 class="mt-2 text-xl font-bold text-slate-950">{{ validationResult()!.certificate_type_name }}</h3>
                    </div>
                    <ui-status-badge [label]="validationResult()!.is_valid ? 'Válido' : 'Pendiente'" [tone]="validationResult()!.is_valid ? 'emerald' : 'amber'" />
                  </div>
                  <p class="mt-4 text-sm leading-6 text-slate-700">{{ validationResult()!.message }}</p>
                </div>
              }
            </ui-section-card>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PublicCertificatesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly publicCertificatesApi = inject(PublicCertificatesApi);

  protected readonly publicTypes = signal<PublicCertificateType[]>([]);
  protected readonly requestResult = signal<PublicCertificateRequestResult | null>(null);
  protected readonly statusResult = signal<PublicCertificateStatus | null>(null);
  protected readonly validationResult = signal<PublicCertificateValidation | null>(null);
  protected readonly requestError = signal('');
  protected readonly lookupError = signal('');
  protected readonly validationError = signal('');
  protected readonly loadingRequest = signal(false);
  protected readonly loadingStatus = signal(false);
  protected readonly loadingValidation = signal(false);
  protected readonly requestForm = this.fb.group({
    certificate_type_code: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    ci_extension: [''],
    purpose: [''],
  });

  protected readonly lookupForm = this.fb.group({
    request_number: ['', [Validators.required]],
    ci: ['', [Validators.required]],
    ci_extension: [''],
  });

  ngOnInit(): void {
    this.publicCertificatesApi.getTypes().subscribe({
      next: (response) => this.publicTypes.set(response.data),
    });
  }

  protected submitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.loadingRequest.set(true);
    this.requestError.set('');
    this.requestResult.set(null);

    const raw = this.requestForm.getRawValue();
    this.publicCertificatesApi.requestCertificate({
      certificate_type_code: raw.certificate_type_code || '',
      ci: raw.ci || '',
      ci_extension: raw.ci_extension || null,
      purpose: raw.purpose || null,
    }).subscribe({
      next: (response) => {
        this.requestResult.set(response.data);
        this.loadingRequest.set(false);
      },
      error: (errorResponse) => {
        this.requestError.set(formatApiError(errorResponse, 'No se pudo registrar la solicitud.'));
        this.loadingRequest.set(false);
      },
    });
  }

  protected submitStatus(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    this.loadingStatus.set(true);
    this.lookupError.set('');
    this.statusResult.set(null);

    const raw = this.lookupForm.getRawValue();
    this.publicCertificatesApi.getStatus({
      request_number: raw.request_number || '',
      ci: raw.ci || '',
      ci_extension: raw.ci_extension || null,
    }).subscribe({
      next: (response) => {
        this.statusResult.set(response.data);
        this.loadingStatus.set(false);
      },
      error: (errorResponse) => {
        this.lookupError.set(formatApiError(errorResponse, 'No se pudo consultar el estado.'));
        this.loadingStatus.set(false);
      },
    });
  }

  protected submitValidation(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    this.loadingValidation.set(true);
    this.validationError.set('');
    this.validationResult.set(null);

    const raw = this.lookupForm.getRawValue();
    this.publicCertificatesApi.validateCertificate({
      request_number: raw.request_number || '',
      ci: raw.ci || '',
      ci_extension: raw.ci_extension || null,
    }).subscribe({
      next: (response) => {
        this.validationResult.set(response.data);
        this.loadingValidation.set(false);
      },
      error: (errorResponse) => {
        this.validationError.set(formatApiError(errorResponse, 'No se pudo validar el certificado.'));
        this.loadingValidation.set(false);
      },
    });
  }

  protected statusTone(status: string): 'emerald' | 'amber' | 'cyan' | 'slate' | 'rose' {
    if (status === 'issued' || status === 'delivered') {
      return 'emerald';
    }
    if (status === 'requested') {
      return 'amber';
    }
    if (status === 'under_review' || status === 'approved') {
      return 'cyan';
    }
    if (status === 'rejected' || status === 'cancelled') {
      return 'rose';
    }
    return 'slate';
  }

  protected formatDateLabel(value?: string | null): string {
    return formatDate(value);
  }
}
