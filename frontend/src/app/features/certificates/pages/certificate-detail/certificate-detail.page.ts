import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import { Certificate } from '../../../../shared/types/certificate.types';
import { TeacherClearance } from '../../../../shared/types/debt.types';
import {
  formatCertificateStatus,
  formatDate,
} from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { DebtsApi } from '../../../debts/data-access/debts.api';
import { CertificatesApi } from '../../data-access/certificates.api';

type CertificateAction = 'request' | 'review' | 'approve' | 'reject' | 'issue' | 'deliver' | 'cancel';

@Component({
  selector: 'app-certificate-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    InlineAlertComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Certificados"
        title="Detalle del certificado"
        description="Revise historial, validaciones y acciones disponibles sin perder de vista el siguiente paso del trámite."
        backLink="/certificates"
        backLabel="Volver a certificados"
      />

      @if (certificate()) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ui-summary-card label="Solicitud" [value]="certificate()!.request_number" icon="description" tone="slate" />
          <ui-summary-card label="Tipo" [value]="certificate()!.certificate_type_name" icon="badge" tone="cyan" />
          <ui-summary-card label="Creado" [value]="formatDateLabel(certificate()!.created_at.slice(0, 10))" icon="calendar_month" tone="slate" />
          <ui-summary-card label="Emitido" [value]="issuedDateLabel()" icon="verified" [tone]="certificate()!.issued_at ? 'emerald' : 'amber'" />
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <ui-section-card title="Resumen del trámite" description="Datos principales, validación y firmantes del certificado." icon="fact_check">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-sm text-slate-500">Docente</p>
                <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ certificate()!.teacher_name }}</h2>
                <p class="mt-2 text-sm text-slate-600">{{ certificate()!.teacher_name }} · {{ certificate()!.certificate_type_name }}</p>
              </div>
              <ui-status-badge [label]="statusLabel(certificate()!.status)" [tone]="statusTone(certificate()!.status)" />
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Plantilla</p>
                <p class="mt-1 font-semibold text-slate-950">{{ certificate()!.template_name }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Origen</p>
                <p class="mt-1 font-semibold text-slate-950">{{ certificate()!.submission_channel_label }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Evento</p>
                <p class="mt-1 font-semibold text-slate-950">{{ certificate()!.event_name || 'No aplica' }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Creado</p>
                <p class="mt-1 font-semibold text-slate-950">{{ formatDateLabel(certificate()!.created_at.slice(0, 10)) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                <p class="text-sm text-slate-500">Emitido</p>
                <p class="mt-1 font-semibold text-slate-950">{{ issuedDateLabel() }}</p>
              </div>
            </div>

            <div class="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
              <p class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Siguiente paso sugerido</p>
              <p class="mt-2 text-lg font-bold text-slate-950">{{ nextStepLabel() }}</p>
              <p class="mt-2 text-sm text-slate-600">{{ nextStepHelp() }}</p>
            </div>

            @if (certificate()!.certificate_type_code === 'no_debt') {
              <div
                class="mt-6 rounded-2xl border p-5"
                [class.border-emerald-200]="clearance()?.eligible"
                [class.bg-emerald-50]="clearance()?.eligible"
                [class.border-amber-200]="clearance() && !clearance()!.eligible"
                [class.bg-amber-50]="clearance() && !clearance()!.eligible"
                [class.border-slate-200]="!clearance()"
                [class.bg-slate-50]="!clearance()"
              >
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Validación de no adeudo</p>
                @if (clearance()) {
                  <p class="mt-2 text-lg font-bold text-slate-950">
                    {{ clearance()!.eligible ? 'Docente apto para emisión' : 'Docente con saldo pendiente' }}
                  </p>
                  <p class="mt-2 text-sm text-slate-700">{{ clearance()!.message }}</p>
                  <p class="mt-2 text-sm text-slate-600">
                    Saldo pendiente: <strong>{{ formatMoney(clearance()!.pending_amount) }}</strong>
                    · Registros pendientes: <strong>{{ clearance()!.pending_obligations_count }}</strong>
                  </p>
                } @else {
                  <p class="mt-2 text-sm text-slate-600">No se pudo cargar la validación de no adeudo en este momento.</p>
                }
              </div>

            }

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
                  <ui-inline-alert tone="warning" title="Sin firmantes asignados" message="Este certificado todavía no tiene firmantes registrados." />
                }
              </div>
            </div>

            @if (certificate()!.rejection_reason || certificate()!.cancel_reason) {
              <div class="mt-6">
                <ui-inline-alert tone="danger" title="Observación del trámite" [message]="certificate()!.rejection_reason || certificate()!.cancel_reason || ''" />
              </div>
            }
          </ui-section-card>

          <div class="space-y-6">
            <ui-section-card title="Acciones disponibles" description="Ejecute solo las acciones válidas para el estado actual." icon="bolt">
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                @for (option of actionButtons(); track option.action) {
                  <button type="button" (click)="runAction(option.action)" class="app-button-secondary">
                    {{ option.label }}
                  </button>
                }
              </div>

              @if (!actionButtons().length) {
                <div class="mt-4">
                  <ui-inline-alert tone="info" title="Sin acciones disponibles" message="Este certificado ya no tiene acciones adicionales desde el estado actual." />
                </div>
              }
            </ui-section-card>

            <ui-section-card title="Historial de estado" description="Cada cambio queda visible para seguimiento administrativo." icon="history">
              <div class="mt-4 space-y-4">
                @for (item of certificate()!.history; track item.id) {
                  <div class="rounded-2xl border border-slate-200 px-4 py-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <p class="font-semibold text-slate-950">{{ statusLabel(item.to_status) }}</p>
                      <ui-status-badge [label]="statusLabel(item.to_status)" [tone]="statusTone(item.to_status)" />
                    </div>
                    <p class="mt-1 text-sm text-slate-600">
                      {{ item.changed_by_name || 'Sistema' }} · {{ formatDateLabel(item.created_at.slice(0, 10)) }}
                    </p>
                    @if (item.reason) {
                      <p class="mt-2 text-sm text-slate-700">{{ item.reason }}</p>
                    }
                  </div>
                }
              </div>
            </ui-section-card>
          </div>
        </div>
      }
    </section>
  `,
})
export class CertificateDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly debtsApi = inject(DebtsApi);
  private readonly uiFeedback = inject(UiFeedbackService);

  protected readonly certificate = signal<Certificate | null>(null);
  protected readonly clearance = signal<TeacherClearance | null>(null);
  protected readonly currentStatus = computed(() => this.certificate()?.status || null);

  ngOnInit(): void {
    this.loadCertificate();
  }

  protected loadCertificate(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.certificatesApi.getCertificate(id).subscribe({
      next: (response) => {
        this.certificate.set(response.data);

        if (response.data.certificate_type_code === 'no_debt') {
          this.debtsApi.getClearance(response.data.teacher_id).subscribe({
            next: (clearanceResponse) => this.clearance.set(clearanceResponse.data),
            error: () => this.clearance.set(null),
          });
          return;
        }

        this.clearance.set(null);
      },
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

    if (
      (action === 'approve' || action === 'issue') &&
      certificate.certificate_type_code === 'no_debt' &&
      this.clearance() &&
      !this.clearance()!.eligible
    ) {
      this.uiFeedback.warning(
        'No apto para no adeudo',
        'Este docente aún tiene saldo pendiente. Registre pagos o regularice su estado de cuenta antes de continuar.',
      );
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

  protected statusTone(status: string): 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' {
    if (status === 'requested') {
      return 'amber';
    }
    if (status === 'under_review') {
      return 'cyan';
    }
    if (status === 'approved' || status === 'issued' || status === 'delivered') {
      return 'emerald';
    }
    if (status === 'rejected' || status === 'cancelled') {
      return 'rose';
    }
    return 'slate';
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected issuedDateLabel(): string {
    const issuedAt = this.certificate()?.issued_at;
    return issuedAt ? this.formatDateLabel(issuedAt.slice(0, 10)) : 'Pendiente';
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value || 0);
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
