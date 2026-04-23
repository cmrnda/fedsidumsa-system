import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import { Certificate } from '../../../../shared/types/certificate.types';
import {
  formatCertificateStatus,
  formatDate,
} from '../../../../shared/utils/ui-helpers';
import { CertificatesApi } from '../../data-access/certificates.api';

type CertificateAction = 'request' | 'review' | 'approve' | 'reject' | 'issue' | 'deliver' | 'cancel';

@Component({
  selector: 'app-certificate-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <a routerLink="/certificates" class="text-sm font-semibold text-cyan-700">← Volver a certificados</a>
          <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Detalle del certificado</h1>
          <p class="mt-2 text-sm text-slate-500">Desde aquí se revisa el historial y se ejecuta la siguiente acción del trámite.</p>
        </div>
      </div>

      @if (certificate()) {
        <div class="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-sm text-slate-500">Solicitud</p>
                <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ certificate()!.request_number }}</h2>
                <p class="mt-2 text-sm text-slate-600">{{ certificate()!.teacher_name }} · {{ certificate()!.certificate_type_name }}</p>
              </div>
              <span class="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {{ statusLabel(certificate()!.status) }}
              </span>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Plantilla</p>
                <p class="mt-1 font-semibold text-slate-950">{{ certificate()!.template_name }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Evento</p>
                <p class="mt-1 font-semibold text-slate-950">{{ certificate()!.event_name || 'No aplica' }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Creado</p>
                <p class="mt-1 font-semibold text-slate-950">{{ formatDateLabel(certificate()!.created_at.slice(0, 10)) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Emitido</p>
                <p class="mt-1 font-semibold text-slate-950">{{ issuedDateLabel() }}</p>
              </div>
            </div>

            <div class="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
              <p class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Siguiente paso sugerido</p>
              <p class="mt-2 text-lg font-bold text-slate-950">{{ nextStepLabel() }}</p>
              <p class="mt-2 text-sm text-slate-600">{{ nextStepHelp() }}</p>
            </div>

            <div class="mt-6">
              <h3 class="text-lg font-bold text-slate-950">Firmantes</h3>
              <div class="mt-3 space-y-3">
                @for (signer of certificate()!.signers; track signer.id) {
                  <div class="rounded-2xl border border-slate-200 px-4 py-4">
                    <p class="font-semibold text-slate-950">{{ signer.teacher_name }}</p>
                    <p class="mt-1 text-sm text-slate-600">{{ signer.position_name }} · {{ signer.instance_name }}</p>
                  </div>
                }
                @if (!certificate()!.signers.length) {
                  <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Este certificado todavía no tiene firmantes asignados.
                  </div>
                }
              </div>
            </div>

            @if (certificate()!.rejection_reason || certificate()!.cancel_reason) {
              <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {{ certificate()!.rejection_reason || certificate()!.cancel_reason }}
              </div>
            }
          </article>

          <article class="space-y-6">
            <div class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 class="text-lg font-bold text-slate-950">Acciones disponibles</h3>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                @for (option of actionButtons(); track option.action) {
                  <button type="button" (click)="runAction(option.action)" class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">
                    {{ option.label }}
                  </button>
                }
              </div>

              @if (!actionButtons().length) {
                <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Este certificado ya no tiene acciones disponibles desde este paso.
                </div>
              }
            </div>

            <div class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 class="text-lg font-bold text-slate-950">Historial de estado</h3>
              <div class="mt-4 space-y-4">
                @for (item of certificate()!.history; track item.id) {
                  <div class="rounded-2xl border border-slate-200 px-4 py-4">
                    <p class="font-semibold text-slate-950">{{ statusLabel(item.to_status) }}</p>
                    <p class="mt-1 text-sm text-slate-600">
                      {{ item.changed_by_name || 'Sistema' }} · {{ formatDateLabel(item.created_at.slice(0, 10)) }}
                    </p>
                    @if (item.reason) {
                      <p class="mt-2 text-sm text-slate-700">{{ item.reason }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          </article>
        </div>
      }
    </section>
  `,
})
export class CertificateDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly uiFeedback = inject(UiFeedbackService);

  protected readonly certificate = signal<Certificate | null>(null);
  protected readonly currentStatus = computed(() => this.certificate()?.status || null);

  ngOnInit(): void {
    this.loadCertificate();
  }

  protected loadCertificate(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.certificatesApi.getCertificate(id).subscribe({
      next: (response) => this.certificate.set(response.data),
    });
  }

  protected actionButtons(): Array<{ action: CertificateAction; label: string }> {
    const status = this.currentStatus();

    if (status === 'draft') {
      return [{ action: 'request', label: 'Enviar a solicitud' }];
    }

    if (status === 'requested') {
      return [{ action: 'review', label: 'Pasar a revisión' }];
    }

    if (status === 'under_review') {
      return [
        { action: 'approve', label: 'Aprobar' },
        { action: 'reject', label: 'Rechazar' },
      ];
    }

    if (status === 'approved') {
      return [
        { action: 'issue', label: 'Emitir certificado' },
        { action: 'cancel', label: 'Cancelar trámite' },
      ];
    }

    if (status === 'issued') {
      return [{ action: 'deliver', label: 'Marcar como entregado' }];
    }

    return [];
  }

  protected async runAction(action: CertificateAction): Promise<void> {
    const certificate = this.certificate();
    if (!certificate) {
      return;
    }

    const config = this.getActionConfig(action);
    const result = await this.uiFeedback.confirm(config);

    if (!result.confirmed) {
      return;
    }

    this.certificatesApi.changeStatus(certificate.id, action, result.reason || undefined).subscribe({
      next: () => {
        this.uiFeedback.success('Estado actualizado', 'El certificado cambió de estado correctamente.');
        this.loadCertificate();
      },
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo actualizar el estado', errorResponse?.error?.message || 'Revise los datos del certificado.');
      },
    });
  }

  protected statusLabel(status: string): string {
    return formatCertificateStatus(status);
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected issuedDateLabel(): string {
    const issuedAt = this.certificate()?.issued_at;
    return issuedAt ? this.formatDateLabel(issuedAt.slice(0, 10)) : 'Pendiente';
  }

  protected nextStepLabel(): string {
    const status = this.currentStatus();

    if (status === 'draft') {
      return 'Enviar la solicitud';
    }
    if (status === 'requested') {
      return 'Pasar a revisión';
    }
    if (status === 'under_review') {
      return 'Aprobar o rechazar';
    }
    if (status === 'approved') {
      return 'Emitir el certificado';
    }
    if (status === 'issued') {
      return 'Registrar entrega';
    }
    if (status === 'delivered') {
      return 'Trámite completado';
    }
    return 'Sin acciones pendientes';
  }

  protected nextStepHelp(): string {
    const status = this.currentStatus();

    if (status === 'draft') {
      return 'Todavía no ingresó al flujo administrativo. Envíelo a solicitud cuando los datos estén listos.';
    }
    if (status === 'requested') {
      return 'El trámite fue recibido y debe ingresar a revisión para evaluación administrativa.';
    }
    if (status === 'under_review') {
      return 'Revise firmantes, datos del docente y procedencia antes de aprobar o rechazar.';
    }
    if (status === 'approved') {
      return 'El contenido ya fue validado. El siguiente paso operativo es emitir el certificado.';
    }
    if (status === 'issued') {
      return 'El certificado ya está emitido. Registre la entrega cuando se complete.';
    }
    if (status === 'delivered') {
      return 'El certificado fue entregado y el proceso quedó cerrado.';
    }
    return 'No hay acciones adicionales disponibles para este trámite.';
  }

  private getActionConfig(action: CertificateAction) {
    if (action === 'request') {
      return {
        title: 'Enviar solicitud',
        message: 'El certificado pasará del estado borrador a solicitado.',
        confirmLabel: 'Enviar solicitud',
        tone: 'default' as const,
      };
    }
    if (action === 'review') {
      return {
        title: 'Pasar a revisión',
        message: 'El certificado quedará listo para evaluación administrativa.',
        confirmLabel: 'Pasar a revisión',
        tone: 'warning' as const,
      };
    }
    if (action === 'approve') {
      return {
        title: 'Aprobar certificado',
        message: 'Confirme que todos los datos y firmantes son correctos antes de aprobar.',
        confirmLabel: 'Aprobar',
        tone: 'success' as const,
      };
    }
    if (action === 'reject') {
      return {
        title: 'Rechazar certificado',
        message: 'Ingrese el motivo para dejar trazabilidad clara del rechazo.',
        confirmLabel: 'Rechazar',
        tone: 'danger' as const,
        reasonLabel: 'Motivo del rechazo',
        reasonPlaceholder: 'Explique por qué no puede continuar el trámite',
        reasonRequired: true,
      };
    }
    if (action === 'issue') {
      return {
        title: 'Emitir certificado',
        message: 'Esta acción marcará el certificado como emitido.',
        confirmLabel: 'Emitir',
        tone: 'success' as const,
      };
    }
    if (action === 'deliver') {
      return {
        title: 'Registrar entrega',
        message: 'Use esta acción cuando el certificado ya haya sido entregado al docente.',
        confirmLabel: 'Registrar entrega',
        tone: 'success' as const,
      };
    }
    return {
      title: 'Cancelar trámite',
      message: 'Ingrese el motivo para cancelar el certificado y dejar registro del caso.',
      confirmLabel: 'Cancelar trámite',
      tone: 'danger' as const,
      reasonLabel: 'Motivo de cancelación',
      reasonPlaceholder: 'Explique por qué el trámite se cancela',
      reasonRequired: true,
    };
  }
}
