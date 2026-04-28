import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Teacher } from '../../../../shared/types/teacher.types';
import {
  Appointment,
  ManagementPeriod,
  OrganizationalInstance,
  Position,
  PositionGroup,
  SupportingDocument,
} from '../../../../shared/types/organization.types';
import {
  appointmentStatusOptions,
  formatApiError,
  formatAppointmentStatus,
  formatDate,
  formatDocumentType,
  formatFullName,
  formatInstanceLevel,
} from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../data-access/organizational.api';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { StepperComponent } from '../../../../shared/ui/stepper.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InlineAlertComponent,
    PageHeaderComponent,
    PaginationComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    StepperComponent,
    SummaryCardComponent,
    TableShellComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Flujo de designaciones"
        title="Asignación guiada de docentes a cargos"
        description="La vista deja visible el orden lógico del trámite: docente, periodo, cargo, compatibilidad y confirmación."
      />

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ui-summary-card label="Docentes disponibles" [value]="teachers().length" icon="groups" tone="slate" />
        <ui-summary-card label="Cargos activos" [value]="positions().length" icon="badge" tone="cyan" />
        <ui-summary-card label="Designaciones registradas" [value]="appointments().length" icon="assignment_ind" tone="rose" />
        <ui-summary-card label="Firmantes vigentes" [value]="currentSignerCount()" icon="draw" tone="amber" />
      </div>

      @if (missingRequirements().length) {
        <ui-inline-alert
          title="Faltan datos base para registrar designaciones"
          [message]="missingRequirements().join(' ')"
          tone="warning"
          icon="warning"
        />
      }

      <div class="grid gap-6 xl:grid-cols-[430px,1fr]">
        <ui-section-card title="Nueva designación" description="Complete el flujo por pasos y deje que el backend valide incompatibilidades." icon="assignment_ind">
          <ui-stepper [steps]="wizardSteps" [currentStep]="currentStep()" />

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">1. Docente</span>
              <select formControlName="teacher_id" class="app-field">
                <option [ngValue]="null">Seleccione un docente</option>
                @for (item of teachers(); track item.id) {
                  <option [ngValue]="item.id">{{ teacherLabel(item.id) }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">2. Periodo de gestión</span>
              <select formControlName="period_id" class="app-field">
                <option [ngValue]="null">Seleccione un periodo</option>
                @for (item of periods(); track item.id) {
                  <option [ngValue]="item.id">{{ item.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">3. Cargo</span>
              <select formControlName="position_id" class="app-field">
                <option [ngValue]="null">Seleccione un cargo</option>
                @for (item of positions(); track item.id) {
                  <option [ngValue]="item.id">{{ positionLabel(item.id) }}</option>
                }
              </select>
            </label>

            @if (selectedPosition()) {
              <div class="rounded-xl border border-cyan-200 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
                <p class="font-semibold text-slate-950">Contexto institucional del cargo</p>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Instancia</p>
                    <p class="mt-1 font-medium text-slate-900">{{ selectedPositionContext().instance }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Grupo de cargo</p>
                    <p class="mt-1 font-medium text-slate-900">{{ selectedPositionContext().group }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Nivel</p>
                    <p class="mt-1 font-medium text-slate-900">{{ selectedPositionContext().level }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Exclusividad</p>
                    <p class="mt-1 font-medium text-slate-900">{{ selectedPosition()?.is_exclusive ? 'Cargo exclusivo' : 'Compatible si no existe regla activa' }}</p>
                  </div>
                </div>
              </div>
            }

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">4. Documento de respaldo</span>
              <select formControlName="supporting_document_id" class="app-field">
                <option [ngValue]="null">Opcional</option>
                @for (item of documents(); track item.id) {
                  <option [ngValue]="item.id">{{ documentLabel(item) }}</option>
                }
              </select>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha de inicio</span>
                <input formControlName="start_date" type="date" class="app-field" />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha de fin</span>
                <input formControlName="end_date" type="date" class="app-field" />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
              <select formControlName="status" class="app-field">
                @for (option of appointmentStatusOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <label class="app-muted-surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700">
              <input formControlName="is_signer" type="checkbox" />
              El docente actúa como firmante
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">5. Observación</span>
              <textarea formControlName="observation" rows="4" placeholder="Detalle adicional si corresponde" class="app-field"></textarea>
            </label>

            @if (error()) {
              <ui-inline-alert title="No se pudo registrar la designación" [message]="error()" tone="danger" icon="error" />
            }

            @if (success()) {
              <ui-inline-alert title="Designación registrada" [message]="success()" tone="success" icon="task_alt" />
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading() || missingRequirements().length > 0"
              class="app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="material-symbols-rounded text-[18px]">{{ loading() ? 'progress_activity' : 'save' }}</span>
              {{ loading() ? 'Guardando...' : 'Registrar designación' }}
            </button>
          </form>
        </ui-section-card>

        <div class="space-y-6">
        <ui-section-card title="Designaciones registradas" description="Revise vigencia, cargo y estado de cada registro. El listado queda separado del formulario para reducir ruido." icon="fact_check">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label class="block min-w-[240px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar docente o cargo</span>
                <input
                  [value]="searchTerm()"
                  (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())"
                  type="text"
                  placeholder="Ej. Ejecutivo o Pérez"
                  class="app-field"
                />
              </label>

              <label class="block min-w-[220px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
                <select
                  [value]="statusFilter()"
                  (change)="statusFilter.set(($any($event.target).value ?? '').trim())"
                  class="app-field"
                >
                  <option value="">Todos</option>
                  @for (option of appointmentStatusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  [checked]="onlySigners()"
                  (change)="onlySigners.set(!!$any($event.target).checked)"
                />
                Solo firmantes
              </label>

              <button
                type="button"
                (click)="loadAll()"
                class="app-button-secondary"
              >
                <span class="material-symbols-rounded text-[18px]">refresh</span>
                Actualizar
              </button>
            </div>
          </div>

          <div class="mt-6">
            <ui-table-shell [empty]="!filteredAppointments().length" emptyMessage="No se encontraron designaciones con el filtro actual.">
            <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-left text-slate-500">
                    <th class="px-4 py-3 font-semibold">Docente</th>
                    <th class="px-4 py-3 font-semibold">Representación</th>
                    <th class="px-4 py-3 font-semibold">Respaldo</th>
                    <th class="px-4 py-3 font-semibold">Vigencia</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (item of paginatedAppointments().items; track item.id) {
                    <tr class="align-top">
                      <td class="px-4 py-4">
                        <p class="font-semibold text-slate-950">{{ teacherDisplay(item) }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ item.can_act_as_signer ?? item.is_signer ? 'Firmante vigente' : item.is_signer ? 'Firmante fuera de vigencia' : 'No firmante' }}
                        </p>
                      </td>
                      <td class="px-4 py-4 text-slate-700">
                        <p class="font-medium text-slate-900">{{ positionDisplay(item) }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ item.instance_name || positionInstanceLabel(item.position_id) }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ item.position_group_name || positionGroupLabel(item.position_id) }}</p>
                      </td>
                      <td class="px-4 py-4 text-slate-700">
                        <p>{{ item.period_name || periodLabel(item.period_id) }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ item.supporting_document_label || supportingDocumentLabel(item.supporting_document_id) }}</p>
                      </td>
                      <td class="px-4 py-4 text-slate-700">
                        <p>{{ formatDateLabel(item.start_date) }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ item.end_date ? 'Hasta ' + formatDateLabel(item.end_date) : 'Sin fecha de fin' }}
                        </p>
                      </td>
                      <td class="px-4 py-4">
                        <ui-status-badge
                          [label]="formatStatus(item.status, item.validity_state)"
                          [tone]="statusTone(item.status, item.validity_state)"
                        />
                      </td>
                    </tr>
                  }
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedAppointments().page"
            [pages]="paginatedAppointments().pages"
            [perPage]="paginatedAppointments().perPage"
            [total]="paginatedAppointments().total"
            [start]="paginatedAppointments().start"
            [end]="paginatedAppointments().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
            </ui-table-shell>
          </div>
        </ui-section-card>
        </div>
      </div>
    </section>
  `,
})
export class AppointmentsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teachersApi = inject(TeachersApi);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly periods = signal<ManagementPeriod[]>([]);
  protected readonly positions = signal<Position[]>([]);
  protected readonly instances = signal<OrganizationalInstance[]>([]);
  protected readonly positionGroups = signal<PositionGroup[]>([]);
  protected readonly documents = signal<SupportingDocument[]>([]);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');
  protected readonly onlySigners = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly wizardSteps = [
    { id: 1, label: 'Seleccionar docente' },
    { id: 2, label: 'Elegir periodo y cargo' },
    { id: 3, label: 'Revisar compatibilidad' },
  ];
  protected readonly appointmentStatusOptions = appointmentStatusOptions;
  protected readonly missingRequirements = computed(() => {
    const pending: string[] = [];

    if (!this.teachers().length) {
      pending.push('No hay docentes registrados.');
    }

    if (!this.periods().length) {
      pending.push('No hay periodos disponibles.');
    }

    if (!this.positions().length) {
      pending.push('No hay cargos disponibles.');
    }

    return pending;
  });
  protected readonly currentSignerCount = computed(
    () => this.appointments().filter((item) => item.can_act_as_signer ?? item.is_signer).length,
  );
  protected readonly filteredAppointments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const onlySigners = this.onlySigners();

    return this.appointments().filter((appointment) => {
      if (status && appointment.status !== status) {
        return false;
      }

      if (onlySigners && !(appointment.can_act_as_signer ?? appointment.is_signer)) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchable = [
        this.teacherDisplay(appointment),
        appointment.period_name || this.periodLabel(appointment.period_id),
        this.positionDisplay(appointment),
        appointment.instance_name || this.positionInstanceLabel(appointment.position_id),
        appointment.position_group_name || this.positionGroupLabel(appointment.position_id),
        appointment.supporting_document_label || this.supportingDocumentLabel(appointment.supporting_document_id),
        formatAppointmentStatus(appointment.status),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  });
  protected readonly paginatedAppointments = computed(() =>
    paginateItems(this.filteredAppointments(), this.tablePage(), this.perPage()),
  );
  protected readonly currentStep = computed(() => {
    if (!this.form.controls.teacher_id.value) {
      return 1;
    }
    if (!this.form.controls.period_id.value || !this.form.controls.position_id.value) {
      return 2;
    }
    return 3;
  });
  protected readonly selectedPosition = computed(() =>
    this.positions().find((item) => item.id === this.form.controls.position_id.value) || null,
  );
  protected readonly selectedPositionContext = computed(() => {
    const position = this.selectedPosition();
    const instance = position ? this.instances().find((item) => item.id === position.instance_id) : null;
    const group = position ? this.positionGroups().find((item) => item.id === position.position_group_id) : null;

    return {
      instance: instance?.name || 'Instancia no disponible',
      group: group?.name || 'Grupo no disponible',
      level: instance ? formatInstanceLevel(instance.level) : 'Nivel no disponible',
    };
  });

  protected readonly form = this.fb.group({
    teacher_id: [null as number | null, [Validators.required]],
    period_id: [null as number | null, [Validators.required]],
    position_id: [null as number | null, [Validators.required]],
    supporting_document_id: [null as number | null],
    start_date: ['', [Validators.required]],
    end_date: [''],
    status: ['active', [Validators.required]],
    is_signer: [false, [Validators.required]],
    observation: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachers.set(response.data),
    });

    this.organizationalApi.getPeriods().subscribe({
      next: (response) => this.periods.set(response.data),
    });

    this.organizationalApi.getPositions().subscribe({
      next: (response) => this.positions.set(response.data),
    });

    this.organizationalApi.getInstances().subscribe({
      next: (response) => this.instances.set(response.data),
    });

    this.organizationalApi.getPositionGroups().subscribe({
      next: (response) => this.positionGroups.set(response.data),
    });

    this.organizationalApi.getDocuments().subscribe({
      next: (response) => this.documents.set(response.data),
    });

    this.organizationalApi.getAppointments().subscribe({
      next: (response) => this.appointments.set(response.data),
    });
  }

  protected teacherLabel(id: number): string {
    const teacher = this.teachers().find((item) => item.id === id);
    return teacher ? formatFullName(teacher.first_names, teacher.last_names) : 'Docente no encontrado';
  }

  protected teacherDisplay(item: Appointment): string {
    return item.teacher_name || this.teacherLabel(item.teacher_id);
  }

  protected periodLabel(id: number): string {
    return this.periods().find((item) => item.id === id)?.name || 'Periodo no encontrado';
  }

  protected positionLabel(id: number): string {
    return this.positions().find((item) => item.id === id)?.name || 'Cargo no encontrado';
  }

  protected positionDisplay(item: Appointment): string {
    return item.position_name || this.positionLabel(item.position_id);
  }

  protected positionInstanceLabel(positionId: number): string {
    const position = this.positions().find((item) => item.id === positionId);
    const instance = position ? this.instances().find((item) => item.id === position.instance_id) : null;
    return instance?.name || 'Instancia no encontrada';
  }

  protected positionGroupLabel(positionId: number): string {
    const position = this.positions().find((item) => item.id === positionId);
    const group = position ? this.positionGroups().find((item) => item.id === position.position_group_id) : null;
    return group?.name || 'Grupo no encontrado';
  }

  protected documentLabel(document: SupportingDocument): string {
    const type = formatDocumentType(document.document_type);
    return document.document_number ? `${type} ${document.document_number}` : type;
  }

  protected supportingDocumentLabel(id?: number | null): string {
    if (!id) {
      return 'Sin documento de respaldo';
    }
    const document = this.documents().find((item) => item.id === id);
    return document ? this.documentLabel(document) : 'Documento no encontrado';
  }

  protected formatDateLabel(value?: string | null): string {
    return formatDate(value);
  }

  protected formatStatus(status: string, validityState?: string): string {
    if (status !== 'active') {
      return formatAppointmentStatus(status);
    }

    if (validityState === 'scheduled') {
      return 'Programada';
    }

    if (validityState === 'expired') {
      return 'Vencida';
    }

    return 'Vigente';
  }

  protected statusTone(status: string, validityState?: string): 'emerald' | 'slate' | 'amber' | 'rose' | 'cyan' {
    if (status === 'finished') {
      return 'slate';
    }
    if (status === 'revoked' || status === 'cancelled') {
      return 'amber';
    }
    if (validityState === 'expired') {
      return 'rose';
    }
    if (validityState === 'scheduled') {
      return 'cyan';
    }
    return 'emerald';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    this.organizationalApi.createAppointment({
      teacher_id: Number(raw.teacher_id),
      period_id: Number(raw.period_id),
      position_id: Number(raw.position_id),
      supporting_document_id: raw.supporting_document_id ? Number(raw.supporting_document_id) : null,
      start_date: raw.start_date || '',
      end_date: raw.end_date || null,
      status: raw.status || 'active',
      is_signer: !!raw.is_signer,
      observation: raw.observation || null,
    }).subscribe({
      next: () => {
        this.success.set('Designación registrada correctamente.');
        this.form.reset({
          teacher_id: null,
          period_id: null,
          position_id: null,
          supporting_document_id: null,
          start_date: '',
          end_date: '',
          status: 'active',
          is_signer: false,
          observation: '',
        });
        this.loadAll();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar la designación.'));
        this.loading.set(false);
      },
    });
  }

  protected updatePerPage(value: number): void {
    this.perPage.set(value);
    this.tablePage.set(1);
  }
}
