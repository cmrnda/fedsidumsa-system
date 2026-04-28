import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import {
  AvailableSigner,
  CertifiableEvent,
  Certificate,
  CertificateTemplate,
  CertificateType,
  EventParticipation,
} from '../../../../shared/types/certificate.types';
import { TeacherClearance } from '../../../../shared/types/debt.types';
import { Teacher } from '../../../../shared/types/teacher.types';
import {
  certificateStatusOptions,
  formatApiError,
  formatCertificateStatus,
  formatDate,
  formatFullName,
} from '../../../../shared/utils/ui-helpers';
import { DebtsApi } from '../../../debts/data-access/debts.api';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { CertificatesApi } from '../../data-access/certificates.api';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { StepperComponent } from '../../../../shared/ui/stepper.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';

@Component({
  selector: 'app-certificates-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InlineAlertComponent,
    PageHeaderComponent,
    PaginationComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    TableShellComponent,
    StepperComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Certificados"
        title="Seguimiento y emisión administrativa"
        description="Revise solicitudes, filtre estados y cree certificados con un flujo guiado, claro y sin relaciones técnicas visibles."
      >
        <button
          header-actions
          type="button"
          (click)="openCreateModal()"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">post_add</span>
          Nuevo certificado
        </button>

        <a
          header-actions
          routerLink="/certificates/setup"
          class="app-button-secondary"
        >
          <span class="material-symbols-rounded text-[18px]">settings</span>
          Configurar catálogos
        </a>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ui-summary-card label="Total" [value]="certificates().length" icon="description" tone="slate" />
        <ui-summary-card label="Solicitados" [value]="countByStatus('requested')" icon="inbox" tone="amber" />
        <ui-summary-card label="En revisión" [value]="countByStatus('under_review')" icon="rule" tone="cyan" />
        <ui-summary-card label="Emitidos" [value]="countByStatus('issued')" icon="verified" tone="emerald" />
        <ui-summary-card label="Solicitudes públicas" [value]="publicRequestCount()" icon="public" tone="rose" />
      </div>

      <ui-section-card
        title="Listado de certificados"
        description="Busque por docente, código, evento o tipo. El siguiente paso queda visible en cada registro."
        icon="list_alt"
      >
        <div section-actions class="flex flex-col gap-3 sm:flex-row">
          <label class="block min-w-[220px]">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
            <input [value]="searchTerm()" (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())" type="text" placeholder="Ej. CERT-2026 o Pérez" class="app-field" />
          </label>

          <label class="block min-w-[220px]">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
            <select [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)" class="app-field">
              <option value="">Todos</option>
              @for (option of certificateStatusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>

          <label class="block min-w-[220px]">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Tipo</span>
            <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)" class="app-field">
              <option value="">Todos</option>
              @for (type of activeTypes(); track type.id) {
                <option [value]="type.id">{{ type.name }}</option>
              }
            </select>
          </label>

          <label class="block min-w-[220px]">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Origen</span>
            <select [value]="originFilter()" (change)="originFilter.set($any($event.target).value)" class="app-field">
              <option value="">Todos</option>
              <option value="internal">Gestión interna</option>
              <option value="public">Solicitud pública</option>
            </select>
          </label>

          <button type="button" (click)="loadAll()" class="app-button-secondary">
            Actualizar
          </button>
        </div>

        <ui-table-shell [empty]="!filteredCertificates().length" emptyMessage="No se encontraron certificados con los filtros actuales.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3 font-semibold">Solicitud</th>
                  <th class="px-4 py-3 font-semibold">Docente</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold">Origen</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold">Próximo paso</th>
                  <th class="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (item of paginatedCertificates().items; track item.id) {
                  <tr>
                    <td class="px-4 py-4">
                      <p class="font-semibold text-slate-950">{{ item.request_number }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ formatDateLabel(item.created_at.slice(0, 10)) }}</p>
                    </td>
                    <td class="px-4 py-4 text-slate-700">
                      <p>{{ item.teacher_name }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ item.event_name || 'Sin evento asociado' }}</p>
                    </td>
                    <td class="px-4 py-4 text-slate-700">{{ item.certificate_type_name }}</td>
                    <td class="px-4 py-4">
                      <ui-status-badge [label]="item.submission_channel_label" [tone]="item.submission_channel === 'public' ? 'rose' : 'slate'" />
                    </td>
                    <td class="px-4 py-4">
                      <ui-status-badge [label]="statusLabel(item.status)" [tone]="statusTone(item.status)" />
                    </td>
                    <td class="px-4 py-4 text-slate-700">{{ nextStepLabel(item.status) }}</td>
                    <td class="px-4 py-4">
                      <a [routerLink]="['/certificates', item.id]" class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">
                        <span class="material-symbols-rounded text-[16px]">visibility</span>
                        Ver detalle
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedCertificates().page"
            [pages]="paginatedCertificates().pages"
            [perPage]="paginatedCertificates().perPage"
            [total]="paginatedCertificates().total"
            [start]="paginatedCertificates().start"
            [end]="paginatedCertificates().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      @if (createModalOpen()) {
        <div class="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div class="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div class="border-b border-slate-200 px-6 py-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Nuevo certificado</p>
                  <h2 class="mt-1 text-2xl font-bold text-slate-950">Asistente de creación</h2>
                  <p class="mt-2 text-sm text-slate-500">{{ wizardStepDescription() }}</p>
                </div>
                <button type="button" (click)="closeCreateModal()" class="app-icon-button">
                  <span class="material-symbols-rounded">close</span>
                </button>
              </div>

              <div class="mt-5">
                <ui-stepper [steps]="wizardSteps" [currentStep]="wizardStep()" />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-6">
              @if (wizardStep() === 1) {
                <div class="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
                  <ui-section-card title="Datos principales" description="Seleccione docente, tipo, plantilla y dependencias del certificado." icon="assignment">
                    <div class="grid gap-5 lg:grid-cols-2">
                      <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-slate-700">Docente</span>
                        <select formControlName="teacher_id" [formGroup]="form" class="app-field">
                          <option [ngValue]="null">Seleccione un docente</option>
                          @for (teacher of teachers(); track teacher.id) {
                            <option [ngValue]="teacher.id">{{ teacherName(teacher) }}</option>
                          }
                        </select>
                      </label>

                      <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-slate-700">Tipo de certificado</span>
                        <select formControlName="certificate_type_id" [formGroup]="form" class="app-field">
                          <option [ngValue]="null">Seleccione un tipo</option>
                          @for (item of activeTypes(); track item.id) {
                            <option [ngValue]="item.id">{{ item.name }}</option>
                          }
                        </select>
                      </label>

                      <label class="block">
                        <span class="mb-2 block text-sm font-semibold text-slate-700">Plantilla</span>
                        <select formControlName="template_id" [formGroup]="form" class="app-field">
                          <option [ngValue]="null">Seleccione una plantilla</option>
                          @for (item of filteredTemplates(); track item.id) {
                            <option [ngValue]="item.id">{{ item.name }}</option>
                          }
                        </select>
                      </label>

                      @if (selectedTypeRequiresEvent()) {
                        <label class="block">
                          <span class="mb-2 block text-sm font-semibold text-slate-700">Evento</span>
                          <select formControlName="event_id" [formGroup]="form" class="app-field">
                            <option [ngValue]="null">Seleccione un evento</option>
                            @for (item of events(); track item.id) {
                              <option [ngValue]="item.id">{{ item.name }}</option>
                            }
                          </select>
                        </label>
                      }

                      @if (!selectedTypeIsNoDebt()) {
                        <label class="block lg:col-span-2">
                          <span class="mb-2 block text-sm font-semibold text-slate-700">Participación registrada</span>
                          <select formControlName="participation_id" [formGroup]="form" class="app-field">
                            <option [ngValue]="null">Opcional</option>
                            @for (item of filteredParticipations(); track item.id) {
                              <option [ngValue]="item.id">{{ participationLabel(item) }}</option>
                            }
                          </select>
                        </label>
                      }

                      <label class="block lg:col-span-2">
                        <span class="mb-2 block text-sm font-semibold text-slate-700">Propósito</span>
                        <input formControlName="purpose" [formGroup]="form" type="text" placeholder="Motivo o uso del certificado" class="app-field" />
                      </label>

                      <label class="block lg:col-span-2">
                        <span class="mb-2 block text-sm font-semibold text-slate-700">Observación</span>
                        <textarea formControlName="observation" [formGroup]="form" rows="4" placeholder="Dato adicional si corresponde" class="app-field"></textarea>
                      </label>
                    </div>
                  </ui-section-card>

                  <ui-section-card title="Validación y ayuda" description="Antes de avanzar, valide dependencias y requisitos del trámite." icon="info">
                    <div class="space-y-4">
                      <ui-inline-alert
                        tone="info"
                        title="Sugerencia operativa"
                        message="Complete docente, tipo y plantilla antes de pasar al paso de firmantes."
                      />

                      @if (selectedTypeIsNoDebt()) {
                        <div
                          class="rounded-2xl border p-5"
                          [class.border-emerald-200]="noDebtClearance()?.eligible"
                          [class.bg-emerald-50]="noDebtClearance()?.eligible"
                          [class.border-amber-200]="noDebtClearance() && !noDebtClearance()!.eligible"
                          [class.bg-amber-50]="noDebtClearance() && !noDebtClearance()!.eligible"
                          [class.border-slate-200]="!noDebtClearance()"
                          [class.bg-slate-50]="!noDebtClearance()"
                        >
                          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Validación de no adeudo</p>
                          @if (noDebtClearance()) {
                            <p class="mt-3 text-xl font-bold text-slate-950">
                              {{ noDebtClearance()!.eligible ? 'Docente apto para no adeudo' : 'Docente con saldo pendiente' }}
                            </p>
                            <p class="mt-2 text-sm text-slate-700">{{ noDebtClearance()!.message }}</p>
                            <p class="mt-3 text-sm text-slate-600">
                              Saldo pendiente: <strong>{{ formatMoney(noDebtClearance()!.pending_amount) }}</strong>
                              · Registros pendientes: <strong>{{ noDebtClearance()!.pending_obligations_count }}</strong>
                            </p>
                            <p class="mt-3 text-xs text-slate-500">
                              El sistema permite crear la solicitud, pero solo aprobar o emitir cuando el docente esté apto.
                            </p>
                          } @else {
                            <p class="mt-3 text-sm text-slate-600">Seleccione un docente para verificar automáticamente si está apto para certificado de no adeudo.</p>
                          }
                        </div>
                      } @else {
                        <ui-inline-alert
                          tone="success"
                          title="Relaciones visibles"
                          message="La participación y el evento se filtran automáticamente según el docente y el tipo seleccionado."
                        />
                      }
                    </div>
                  </ui-section-card>
                </div>
              }

              @if (wizardStep() === 2) {
                <ui-section-card title="Seleccionar firmantes" description="Solo se muestran designaciones vigentes marcadas como firmantes." icon="draw">
                  <button section-actions type="button" (click)="loadAvailableSigners()" class="app-button-secondary">
                    Actualizar lista
                  </button>

                  <div class="grid gap-3">
                    @for (signer of availableSigners(); track signer.appointment_id) {
                      <label class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-cyan-300"
                        [class.bg-cyan-50]="isSignerSelected(signer.appointment_id)"
                        [class.border-cyan-300]="isSignerSelected(signer.appointment_id)"
                      >
                        <input
                          type="checkbox"
                          [checked]="isSignerSelected(signer.appointment_id)"
                          (change)="toggleSigner(signer.appointment_id, $any($event.target).checked)"
                        />
                        <span class="min-w-0 text-sm">
                          <span class="block font-semibold text-slate-950">{{ signer.teacher_name }}</span>
                          <span class="mt-1 block text-slate-600">{{ signer.position_name }} · {{ signer.instance_name }}</span>
                          <span class="mt-1 block text-xs text-slate-500">{{ signer.period_name }} · {{ signer.start_date }}{{ signer.end_date ? ' a ' + signer.end_date : '' }}</span>
                        </span>
                      </label>
                    }
                  </div>

                  @if (!availableSigners().length) {
                    <ui-inline-alert
                      tone="warning"
                      title="No hay firmantes válidos"
                      message="Revise las designaciones activas marcadas con opción de firma antes de continuar."
                    />
                  }
                </ui-section-card>
              }

              @if (wizardStep() === 3) {
                <div class="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
                  <ui-section-card title="Resumen del certificado" description="Revise los datos principales antes de guardar o solicitar." icon="fact_check">
                    <dl class="space-y-3 text-sm">
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Docente</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedTeacherLabel() }}</dd>
                      </div>
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Tipo</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedTypeLabel() }}</dd>
                      </div>
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Plantilla</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedTemplateLabel() }}</dd>
                      </div>
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Evento</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedEventLabel() }}</dd>
                      </div>
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Participación</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedParticipationLabel() }}</dd>
                      </div>
                      <div class="flex items-start justify-between gap-4">
                        <dt class="text-slate-500">Firmantes</dt>
                        <dd class="text-right font-semibold text-slate-950">{{ selectedSignerIds().length }}</dd>
                      </div>
                    </dl>
                  </ui-section-card>

                  <ui-section-card title="Antes de guardar" description="Use este bloque como revisión final del trámite." icon="checklist">
                    <ul class="space-y-3 text-sm text-slate-600">
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Verifique que el docente y el tipo sean correctos.</span></li>
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Confirme que los firmantes correspondan a designaciones vigentes.</span></li>
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Si desea que entre a revisión de inmediato, use “Crear y solicitar”.</span></li>
                    </ul>

                  @if (selectedTypeIsNoDebt() && noDebtClearance()) {
                      <div class="mt-5 rounded-2xl border p-4"
                        [class.border-emerald-200]="noDebtClearance()!.eligible"
                        [class.bg-emerald-50]="noDebtClearance()!.eligible"
                        [class.border-amber-200]="!noDebtClearance()!.eligible"
                        [class.bg-amber-50]="!noDebtClearance()!.eligible"
                      >
                        <p class="font-semibold text-slate-950">
                          {{ noDebtClearance()!.eligible ? 'El docente está apto para no adeudo.' : 'El docente aún no está apto para no adeudo.' }}
                        </p>
                        <p class="mt-2 text-sm text-slate-700">
                          {{ noDebtClearance()!.message }}
                        </p>
                      </div>
                    }

                  </ui-section-card>
                </div>
              }
            </div>

            <div class="border-t border-slate-200 px-6 py-5">
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex gap-3">
                  @if (wizardStep() > 1) {
                    <button type="button" (click)="goToPreviousStep()" class="app-button-secondary">
                      Anterior
                    </button>
                  }
                </div>

                <div class="flex flex-col gap-3 sm:flex-row">
                  @if (wizardStep() < 3) {
                    <button type="button" (click)="goToNextStep()" class="app-button-primary">
                      Siguiente
                    </button>
                  } @else {
                    <button type="button" (click)="submit('draft')" [disabled]="loading()" class="app-button-secondary">
                      Guardar borrador
                    </button>
                    <button type="button" (click)="submit('requested')" [disabled]="loading()" class="app-button-primary">
                      Crear y solicitar
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class CertificatesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly teachersApi = inject(TeachersApi);
  private readonly debtsApi = inject(DebtsApi);
  private readonly uiFeedback = inject(UiFeedbackService);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly certificateTypes = signal<CertificateType[]>([]);
  protected readonly templates = signal<CertificateTemplate[]>([]);
  protected readonly events = signal<CertifiableEvent[]>([]);
  protected readonly participations = signal<EventParticipation[]>([]);
  protected readonly availableSigners = signal<AvailableSigner[]>([]);
  protected readonly certificates = signal<Certificate[]>([]);
  protected readonly selectedSignerIds = signal<number[]>([]);
  protected readonly noDebtClearance = signal<TeacherClearance | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');
  protected readonly typeFilter = signal('');
  protected readonly originFilter = signal('');
  protected readonly loading = signal(false);
  protected readonly createModalOpen = signal(false);
  protected readonly wizardStep = signal(1);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly certificateStatusOptions = certificateStatusOptions;
  protected readonly wizardSteps = [
    { id: 1, label: 'Datos principales' },
    { id: 2, label: 'Firmantes' },
    { id: 3, label: 'Revisión final' },
  ];

  protected readonly activeTypes = computed(() => this.certificateTypes().filter((item) => item.is_active));
  protected readonly selectedType = computed(() => {
    const typeId = this.form.controls.certificate_type_id.value;
    return this.certificateTypes().find((item) => item.id === typeId) || null;
  });
  protected readonly filteredTemplates = computed(() => {
    const typeId = this.form.controls.certificate_type_id.value;
    return this.templates().filter((item) => item.certificate_type_id === typeId && item.is_active);
  });
  protected readonly filteredParticipations = computed(() => {
    const teacherId = this.form.controls.teacher_id.value;
    const eventId = this.form.controls.event_id.value;

    return this.participations().filter((item) => {
      if (teacherId && item.teacher_id !== teacherId) {
        return false;
      }
      if (eventId && item.event_id !== eventId) {
        return false;
      }
      return true;
    });
  });
  protected readonly filteredCertificates = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const typeId = this.typeFilter();
    const origin = this.originFilter();

    return this.certificates().filter((item) => {
      const matchesStatus = !status || item.status === status;
      const matchesType = !typeId || String(item.certificate_type_id) === typeId;
      const matchesOrigin = !origin || item.submission_channel === origin;
      const matchesSearch = !term || [
        item.request_number,
        item.teacher_name,
        item.certificate_type_name,
        item.event_name,
        item.submission_channel_label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
      return matchesStatus && matchesType && matchesOrigin && matchesSearch;
    });
  });
  protected readonly publicRequestCount = computed(
    () => this.certificates().filter((item) => item.submission_channel === 'public').length,
  );
  protected readonly paginatedCertificates = computed(() =>
    paginateItems(this.filteredCertificates(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.group({
    teacher_id: [null as number | null, [Validators.required]],
    certificate_type_id: [null as number | null, [Validators.required]],
    template_id: [null as number | null, [Validators.required]],
    event_id: [null as number | null],
    participation_id: [null as number | null],
    purpose: [''],
    observation: [''],
  });

  ngOnInit(): void {
    this.form.controls.teacher_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshNoDebtClearance());

    this.form.controls.certificate_type_id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.selectedTypeIsNoDebt()) {
          this.form.patchValue({
            event_id: null,
            participation_id: null,
          });
        }

        if (!this.filteredTemplates().some((item) => item.id === this.form.controls.template_id.value)) {
          this.form.patchValue({ template_id: null });
        }

        this.refreshNoDebtClearance();
      });

    this.loadAll();
  }

  protected loadAll(): void {
    this.teachersApi.getAll().subscribe({ next: (response) => this.teachers.set(response.data) });
    this.certificatesApi.getTypes().subscribe({ next: (response) => this.certificateTypes.set(response.data) });
    this.certificatesApi.getTemplates().subscribe({ next: (response) => this.templates.set(response.data) });
    this.certificatesApi.getEvents().subscribe({ next: (response) => this.events.set(response.data) });
    this.certificatesApi.getParticipations().subscribe({ next: (response) => this.participations.set(response.data) });
    this.loadAvailableSigners();
    this.certificatesApi.getCertificates().subscribe({ next: (response) => this.certificates.set(response.data) });
  }

  protected loadAvailableSigners(): void {
    this.certificatesApi.getAvailableSigners().subscribe({
      next: (response) => this.availableSigners.set(response.data),
    });
  }

  protected openCreateModal(): void {
    this.createModalOpen.set(true);
    this.wizardStep.set(1);
  }

  protected closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.wizardStep.set(1);
    this.selectedSignerIds.set([]);
    this.noDebtClearance.set(null);
    this.form.reset({
      teacher_id: null,
      certificate_type_id: null,
      template_id: null,
      event_id: null,
      participation_id: null,
      purpose: '',
      observation: '',
    });
  }

  protected goToNextStep(): void {
    if (this.wizardStep() === 1) {
      if (this.form.controls.teacher_id.invalid || this.form.controls.certificate_type_id.invalid || this.form.controls.template_id.invalid) {
        this.form.markAllAsTouched();
        this.uiFeedback.warning('Faltan datos principales', 'Complete docente, tipo y plantilla antes de continuar.');
        return;
      }

      if (this.selectedTypeRequiresEvent() && !this.form.controls.event_id.value) {
        this.uiFeedback.warning('Evento requerido', 'El tipo seleccionado necesita un evento asociado.');
        return;
      }
    }

    if (this.wizardStep() === 2 && !this.selectedSignerIds().length) {
      this.uiFeedback.warning('Seleccione firmantes', 'Agregue al menos un firmante antes de revisar el certificado.');
      return;
    }

    this.wizardStep.update((value) => Math.min(value + 1, 3));
  }

  protected goToPreviousStep(): void {
    this.wizardStep.update((value) => Math.max(value - 1, 1));
  }

  protected selectedTypeRequiresEvent(): boolean {
    return this.selectedType()?.requires_event ?? false;
  }

  protected selectedTypeIsNoDebt(): boolean {
    return this.selectedType()?.code === 'no_debt';
  }

  protected toggleSigner(appointmentId: number, checked: boolean): void {
    const current = this.selectedSignerIds();
    if (checked) {
      this.selectedSignerIds.set([...current, appointmentId]);
      return;
    }
    this.selectedSignerIds.set(current.filter((item) => item !== appointmentId));
  }

  protected isSignerSelected(appointmentId: number): boolean {
    return this.selectedSignerIds().includes(appointmentId);
  }

  protected submit(status: 'draft' | 'requested'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();

    this.certificatesApi.createCertificate({
      teacher_id: Number(raw.teacher_id),
      certificate_type_id: Number(raw.certificate_type_id),
      template_id: Number(raw.template_id),
      event_id: raw.event_id ? Number(raw.event_id) : null,
      participation_id: raw.participation_id ? Number(raw.participation_id) : null,
      purpose: raw.purpose || null,
      observation: raw.observation || null,
      status,
      signer_ids: this.selectedSignerIds().map((appointmentId, index) => ({
        appointment_id: appointmentId,
        order_index: index + 1,
      })),
    }).subscribe({
      next: () => {
        this.uiFeedback.success(
          status === 'requested' ? 'Solicitud registrada' : 'Borrador guardado',
          status === 'requested'
            ? 'El certificado fue creado y enviado al flujo de revisión.'
            : 'El certificado quedó disponible para continuar luego.',
        );
        this.closeCreateModal();
        this.loadAll();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo crear el certificado', formatApiError(errorResponse));
        this.loading.set(false);
      },
    });
  }

  protected teacherName(teacher: Teacher): string {
    return formatFullName(teacher.first_names, teacher.last_names);
  }

  protected participationLabel(item: EventParticipation): string {
    const teacher = this.teachers().find((entry) => entry.id === item.teacher_id);
    const event = this.events().find((entry) => entry.id === item.event_id);
    return `${teacher ? this.teacherName(teacher) : 'Docente'} · ${event?.name || 'Evento'}`;
  }

  protected selectedTeacherLabel(): string {
    const teacherId = this.form.controls.teacher_id.value;
    const teacher = this.teachers().find((item) => item.id === teacherId);
    return teacher ? this.teacherName(teacher) : 'No seleccionado';
  }

  protected selectedTypeLabel(): string {
    return this.selectedType()?.name || 'No seleccionado';
  }

  protected selectedTemplateLabel(): string {
    const templateId = this.form.controls.template_id.value;
    return this.templates().find((item) => item.id === templateId)?.name || 'No seleccionada';
  }

  protected selectedEventLabel(): string {
    const eventId = this.form.controls.event_id.value;
    return this.events().find((item) => item.id === eventId)?.name || 'No aplica';
  }

  protected selectedParticipationLabel(): string {
    const participationId = this.form.controls.participation_id.value;
    const participation = this.participations().find((item) => item.id === participationId);
    return participation ? this.participationLabel(participation) : 'No seleccionada';
  }

  protected wizardStepDescription(): string {
    if (this.wizardStep() === 1) {
      return 'Seleccione docente, tipo, plantilla y dependencias necesarias.';
    }
    if (this.wizardStep() === 2) {
      return 'Elija los firmantes válidos desde designaciones activas.';
    }
    return 'Revise el resumen y decida si guarda borrador o solicita revisión.';
  }

  protected statusLabel(status: string): string {
    return formatCertificateStatus(status);
  }

  protected statusTone(status: Certificate['status']): 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' {
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

  protected nextStepLabel(status: string): string {
    if (status === 'draft') {
      return 'Enviar a solicitud';
    }
    if (status === 'requested') {
      return 'Pasar a revisión';
    }
    if (status === 'under_review') {
      return 'Aprobar o rechazar';
    }
    if (status === 'approved') {
      return 'Emitir';
    }
    if (status === 'issued') {
      return 'Entregar';
    }
    return 'Sin acción pendiente';
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected updatePerPage(value: number): void {
    this.perPage.set(value);
    this.tablePage.set(1);
  }

  protected countByStatus(status: Certificate['status']): number {
    return this.certificates().filter((item) => item.status === status).length;
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value || 0);
  }

  private refreshNoDebtClearance(): void {
    if (!this.selectedTypeIsNoDebt()) {
      this.noDebtClearance.set(null);
      return;
    }

    const teacherId = this.form.controls.teacher_id.value;
    if (!teacherId) {
      this.noDebtClearance.set(null);
      return;
    }

    this.debtsApi.getClearance(Number(teacherId)).subscribe({
      next: (response) => this.noDebtClearance.set(response.data),
      error: () => this.noDebtClearance.set(null),
    });
  }
}
