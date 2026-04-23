import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { Teacher } from '../../../../shared/types/teacher.types';
import {
  certificateStatusOptions,
  formatApiError,
  formatCertificateStatus,
  formatDate,
  formatFullName,
} from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { CertificatesApi } from '../../data-access/certificates.api';

@Component({
  selector: 'app-certificates-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Módulo de certificados</p>
          <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Seguimiento claro y emisión con pasos guiados</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Desde aquí administración puede revisar solicitudes, identificar pendientes y crear nuevos certificados sin ingresar datos técnicos ni resolver relaciones manualmente.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Total</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ certificates().length }}</p>
            </div>
            <div class="rounded-2xl bg-amber-50 p-4">
              <p class="text-sm text-amber-700">Solicitados</p>
              <p class="mt-2 text-2xl font-bold text-amber-900">{{ countByStatus('requested') }}</p>
            </div>
            <div class="rounded-2xl bg-cyan-50 p-4">
              <p class="text-sm text-cyan-700">En revisión</p>
              <p class="mt-2 text-2xl font-bold text-cyan-900">{{ countByStatus('under_review') }}</p>
            </div>
            <div class="rounded-2xl bg-emerald-50 p-4">
              <p class="text-sm text-emerald-700">Emitidos</p>
              <p class="mt-2 text-2xl font-bold text-emerald-900">{{ countByStatus('issued') }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Tareas recomendadas</p>
          <div class="mt-4 space-y-3">
            <button type="button" (click)="openCreateModal()" class="flex w-full items-start gap-3 rounded-2xl border border-cyan-200 bg-white px-4 py-4 text-left transition hover:border-cyan-400">
              <span class="material-symbols-rounded text-cyan-700">post_add</span>
              <span>
                <span class="block font-semibold text-slate-950">Nuevo certificado</span>
                <span class="mt-1 block text-sm text-slate-600">Asistente por pasos para crear, revisar y solicitar.</span>
              </span>
            </button>

            <a routerLink="/certificates/setup" class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-cyan-300">
              <span class="material-symbols-rounded text-cyan-700">settings</span>
              <span>
                <span class="block font-semibold text-slate-950">Configurar catálogos</span>
                <span class="mt-1 block text-sm text-slate-600">Tipos, plantillas, eventos y participaciones.</span>
              </span>
            </a>
          </div>
        </article>
      </div>

      <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-950">Listado de certificados</h2>
            <p class="text-sm text-slate-500">Busque por docente, código, evento o tipo. El siguiente paso queda visible en cada registro.</p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <label class="block min-w-[220px]">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
              <input [value]="searchTerm()" (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())" type="text" placeholder="Ej. CERT-2026 o Pérez" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>

            <label class="block min-w-[220px]">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
              <select [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option value="">Todos</option>
                @for (option of certificateStatusOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <label class="block min-w-[220px]">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Tipo</span>
              <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option value="">Todos</option>
                @for (type of activeTypes(); track type.id) {
                  <option [value]="type.id">{{ type.name }}</option>
                }
              </select>
            </label>

            <button type="button" (click)="loadAll()" class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
              Actualizar
            </button>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3 font-semibold">Solicitud</th>
                  <th class="px-4 py-3 font-semibold">Docente</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold">Próximo paso</th>
                  <th class="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (item of filteredCertificates(); track item.id) {
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
                      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {{ statusLabel(item.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-slate-700">{{ nextStepLabel(item.status) }}</td>
                    <td class="px-4 py-4">
                      <a [routerLink]="['/certificates', item.id]" class="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                        <span class="material-symbols-rounded text-[16px]">visibility</span>
                        Ver detalle
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!filteredCertificates().length) {
            <div class="px-6 py-10 text-center text-sm text-slate-500">No se encontraron certificados con los filtros actuales.</div>
          }
        </div>
      </article>

      @if (createModalOpen()) {
        <div class="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div class="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div class="border-b border-slate-200 px-6 py-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Nuevo certificado</p>
                  <h2 class="mt-1 text-2xl font-bold text-slate-950">Asistente de creación</h2>
                  <p class="mt-2 text-sm text-slate-500">{{ wizardStepDescription() }}</p>
                </div>
                <button type="button" (click)="closeCreateModal()" class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700">
                  <span class="material-symbols-rounded">close</span>
                </button>
              </div>

              <div class="mt-5 grid gap-3 md:grid-cols-3">
                @for (step of wizardSteps; track step.id) {
                  <div class="rounded-2xl border px-4 py-3"
                    [class.border-cyan-300]="wizardStep() === step.id"
                    [class.bg-cyan-50]="wizardStep() === step.id"
                    [class.border-slate-200]="wizardStep() !== step.id"
                  >
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso {{ step.id }}</p>
                    <p class="mt-1 font-semibold text-slate-950">{{ step.label }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-6">
              @if (wizardStep() === 1) {
                <div class="grid gap-5 lg:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Docente</span>
                    <select formControlName="teacher_id" [formGroup]="form" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                      <option [ngValue]="null">Seleccione un docente</option>
                      @for (teacher of teachers(); track teacher.id) {
                        <option [ngValue]="teacher.id">{{ teacherName(teacher) }}</option>
                      }
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Tipo de certificado</span>
                    <select formControlName="certificate_type_id" [formGroup]="form" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                      <option [ngValue]="null">Seleccione un tipo</option>
                      @for (item of activeTypes(); track item.id) {
                        <option [ngValue]="item.id">{{ item.name }}</option>
                      }
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Plantilla</span>
                    <select formControlName="template_id" [formGroup]="form" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                      <option [ngValue]="null">Seleccione una plantilla</option>
                      @for (item of filteredTemplates(); track item.id) {
                        <option [ngValue]="item.id">{{ item.name }}</option>
                      }
                    </select>
                  </label>

                  @if (selectedTypeRequiresEvent()) {
                    <label class="block">
                      <span class="mb-2 block text-sm font-semibold text-slate-700">Evento</span>
                      <select formControlName="event_id" [formGroup]="form" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                        <option [ngValue]="null">Seleccione un evento</option>
                        @for (item of events(); track item.id) {
                          <option [ngValue]="item.id">{{ item.name }}</option>
                        }
                      </select>
                    </label>
                  }

                  <label class="block lg:col-span-2">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Participación registrada</span>
                    <select formControlName="participation_id" [formGroup]="form" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                      <option [ngValue]="null">Opcional</option>
                      @for (item of filteredParticipations(); track item.id) {
                        <option [ngValue]="item.id">{{ participationLabel(item) }}</option>
                      }
                    </select>
                  </label>

                  <label class="block lg:col-span-2">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Propósito</span>
                    <input formControlName="purpose" [formGroup]="form" type="text" placeholder="Motivo o uso del certificado" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
                  </label>

                  <label class="block lg:col-span-2">
                    <span class="mb-2 block text-sm font-semibold text-slate-700">Observación</span>
                    <textarea formControlName="observation" [formGroup]="form" rows="4" placeholder="Dato adicional si corresponde" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
                  </label>
                </div>
              }

              @if (wizardStep() === 2) {
                <div class="space-y-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 class="text-lg font-bold text-slate-950">Seleccionar firmantes</h3>
                      <p class="text-sm text-slate-500">Solo se muestran designaciones vigentes marcadas como firmantes.</p>
                    </div>
                    <button type="button" (click)="loadAvailableSigners()" class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
                      Actualizar lista
                    </button>
                  </div>

                  <div class="grid gap-3">
                    @for (signer of availableSigners(); track signer.appointment_id) {
                      <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-cyan-300"
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
                    <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      No hay firmantes válidos disponibles. Revise las designaciones activas con opción de firma.
                    </div>
                  }
                </div>
              }

              @if (wizardStep() === 3) {
                <div class="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 class="text-lg font-bold text-slate-950">Resumen del certificado</h3>
                    <dl class="mt-4 space-y-3 text-sm">
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
                  </div>

                  <div class="rounded-3xl border border-slate-200 bg-white p-5">
                    <h3 class="text-lg font-bold text-slate-950">Antes de guardar</h3>
                    <ul class="mt-4 space-y-3 text-sm text-slate-600">
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Verifique que el docente y el tipo sean correctos.</span></li>
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Confirme que los firmantes correspondan a designaciones vigentes.</span></li>
                      <li class="flex gap-3"><span class="material-symbols-rounded text-cyan-700">check_circle</span><span>Si desea que entre a revisión de inmediato, use “Crear y solicitar”.</span></li>
                    </ul>
                  </div>
                </div>
              }
            </div>

            <div class="border-t border-slate-200 px-6 py-5">
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex gap-3">
                  @if (wizardStep() > 1) {
                    <button type="button" (click)="goToPreviousStep()" class="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                      Anterior
                    </button>
                  }
                </div>

                <div class="flex flex-col gap-3 sm:flex-row">
                  @if (wizardStep() < 3) {
                    <button type="button" (click)="goToNextStep()" class="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
                      Siguiente
                    </button>
                  } @else {
                    <button type="button" (click)="submit('draft')" [disabled]="loading()" class="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                      Guardar borrador
                    </button>
                    <button type="button" (click)="submit('requested')" [disabled]="loading()" class="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
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
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly teachersApi = inject(TeachersApi);
  private readonly uiFeedback = inject(UiFeedbackService);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly certificateTypes = signal<CertificateType[]>([]);
  protected readonly templates = signal<CertificateTemplate[]>([]);
  protected readonly events = signal<CertifiableEvent[]>([]);
  protected readonly participations = signal<EventParticipation[]>([]);
  protected readonly availableSigners = signal<AvailableSigner[]>([]);
  protected readonly certificates = signal<Certificate[]>([]);
  protected readonly selectedSignerIds = signal<number[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');
  protected readonly typeFilter = signal('');
  protected readonly loading = signal(false);
  protected readonly createModalOpen = signal(false);
  protected readonly wizardStep = signal(1);
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

    return this.certificates().filter((item) => {
      const matchesStatus = !status || item.status === status;
      const matchesType = !typeId || String(item.certificate_type_id) === typeId;
      const matchesSearch = !term || [
        item.request_number,
        item.teacher_name,
        item.certificate_type_name,
        item.event_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
      return matchesStatus && matchesType && matchesSearch;
    });
  });

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

  protected countByStatus(status: Certificate['status']): number {
    return this.certificates().filter((item) => item.status === status).length;
  }
}
