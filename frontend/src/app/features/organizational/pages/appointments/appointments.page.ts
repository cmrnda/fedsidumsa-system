import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Teacher } from '../../../../shared/types/teacher.types';
import {
  Appointment,
  ManagementPeriod,
  Position,
  SupportingDocument,
} from '../../../../shared/types/organization.types';
import {
  appointmentStatusOptions,
  formatApiError,
  formatAppointmentStatus,
  formatDate,
  formatDocumentType,
  formatFullName,
} from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div class="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Flujo de designaciones</p>
          <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Asignación entendible de docentes a cargos</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Antes de guardar, revise el docente, el periodo y el cargo. Si existe incompatibilidad con otra designación vigente, el sistema mostrará el error para evitar solapamientos.
          </p>

          <div class="mt-6 grid gap-3 md:grid-cols-3">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Docentes disponibles</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ teachers().length }}</p>
            </div>
            <div class="rounded-2xl bg-cyan-50 p-4">
              <p class="text-sm text-cyan-700">Cargos activos</p>
              <p class="mt-2 text-2xl font-bold text-cyan-900">{{ positions().length }}</p>
            </div>
            <div class="rounded-2xl bg-rose-50 p-4">
              <p class="text-sm text-rose-700">Designaciones registradas</p>
              <p class="mt-2 text-2xl font-bold text-rose-900">{{ appointments().length }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Antes de registrar</p>
          <ul class="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-rose-700">groups</span>
              El docente debe existir en el módulo de docentes.
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-rose-700">calendar_month</span>
              Debe existir un periodo y al menos un cargo configurado.
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-rose-700">rule</span>
              Si el cargo es incompatible con otro activo, el backend bloqueará el registro.
            </li>
          </ul>
        </article>
      </div>

      @if (missingRequirements().length) {
        <article class="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div class="flex items-start gap-3">
            <span class="material-symbols-rounded mt-0.5">warning</span>
            <div>
              <h2 class="text-lg font-bold">Faltan datos base para registrar designaciones</h2>
              <p class="mt-2 text-sm leading-6">
                {{ missingRequirements().join(' ') }}
              </p>
            </div>
          </div>
        </article>
      }

      <div class="grid gap-6 xl:grid-cols-[440px,1fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="material-symbols-rounded rounded-2xl bg-rose-50 p-3 text-rose-700">assignment_ind</span>
            <div>
              <h2 class="text-xl font-bold text-slate-950">Nueva designación</h2>
              <p class="text-sm text-slate-500">Seleccione los elementos del flujo en orden.</p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">1. Docente</span>
              <select formControlName="teacher_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option [ngValue]="null">Seleccione un docente</option>
                @for (item of teachers(); track item.id) {
                  <option [ngValue]="item.id">{{ teacherLabel(item.id) }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">2. Periodo de gestión</span>
              <select formControlName="period_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option [ngValue]="null">Seleccione un periodo</option>
                @for (item of periods(); track item.id) {
                  <option [ngValue]="item.id">{{ item.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">3. Cargo</span>
              <select formControlName="position_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option [ngValue]="null">Seleccione un cargo</option>
                @for (item of positions(); track item.id) {
                  <option [ngValue]="item.id">{{ positionLabel(item.id) }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Documento de respaldo</span>
              <select formControlName="supporting_document_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option [ngValue]="null">Opcional</option>
                @for (item of documents(); track item.id) {
                  <option [ngValue]="item.id">{{ documentLabel(item) }}</option>
                }
              </select>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha de inicio</span>
                <input formControlName="start_date" type="date" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha de fin</span>
                <input formControlName="end_date" type="date" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
              <select formControlName="status" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                @for (option of appointmentStatusOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input formControlName="is_signer" type="checkbox" />
              El docente actúa como firmante
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Observación</span>
              <textarea formControlName="observation" rows="4" placeholder="Detalle adicional si corresponde" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            </label>

            @if (error()) {
              <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {{ error() }}
              </div>
            }

            @if (success()) {
              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {{ success() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading() || missingRequirements().length > 0"
              class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="material-symbols-rounded text-[18px]">{{ loading() ? 'progress_activity' : 'save' }}</span>
              {{ loading() ? 'Guardando...' : 'Registrar designación' }}
            </button>
          </form>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="text-xl font-bold text-slate-950">Designaciones registradas</h2>
              <p class="text-sm text-slate-500">Revise el estado, el cargo y la vigencia de cada registro.</p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <label class="block min-w-[240px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar docente o cargo</span>
                <input
                  [value]="searchTerm()"
                  (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())"
                  type="text"
                  placeholder="Ej. Ejecutivo o Pérez"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              <button
                type="button"
                (click)="loadAll()"
                class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-900"
              >
                <span class="material-symbols-rounded text-[18px]">refresh</span>
                Actualizar
              </button>
            </div>
          </div>

          <div class="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-left text-slate-500">
                    <th class="px-4 py-3 font-semibold">Docente</th>
                    <th class="px-4 py-3 font-semibold">Periodo</th>
                    <th class="px-4 py-3 font-semibold">Cargo</th>
                    <th class="px-4 py-3 font-semibold">Vigencia</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (item of filteredAppointments(); track item.id) {
                    <tr class="align-top">
                      <td class="px-4 py-4">
                        <p class="font-semibold text-slate-950">{{ teacherLabel(item.teacher_id) }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ item.is_signer ? 'Firmante' : 'No firmante' }}
                        </p>
                      </td>
                      <td class="px-4 py-4 text-slate-700">{{ periodLabel(item.period_id) }}</td>
                      <td class="px-4 py-4 text-slate-700">{{ positionLabel(item.position_id) }}</td>
                      <td class="px-4 py-4 text-slate-700">
                        <p>{{ formatDateLabel(item.start_date) }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ item.end_date ? 'Hasta ' + formatDateLabel(item.end_date) : 'Sin fecha de fin' }}
                        </p>
                      </td>
                      <td class="px-4 py-4">
                        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {{ formatStatus(item.status) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (!filteredAppointments().length) {
              <div class="px-6 py-10 text-center text-sm text-slate-500">
                No se encontraron designaciones con el filtro actual.
              </div>
            }
          </div>
        </article>
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
  protected readonly documents = signal<SupportingDocument[]>([]);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
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
  protected readonly filteredAppointments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    return this.appointments().filter((appointment) => {
      if (!term) {
        return true;
      }

      const searchable = [
        this.teacherLabel(appointment.teacher_id),
        this.periodLabel(appointment.period_id),
        this.positionLabel(appointment.position_id),
        formatAppointmentStatus(appointment.status),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
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

  protected periodLabel(id: number): string {
    return this.periods().find((item) => item.id === id)?.name || 'Periodo no encontrado';
  }

  protected positionLabel(id: number): string {
    return this.positions().find((item) => item.id === id)?.name || 'Cargo no encontrado';
  }

  protected documentLabel(document: SupportingDocument): string {
    const type = formatDocumentType(document.document_type);
    return document.document_number ? `${type} ${document.document_number}` : type;
  }

  protected formatDateLabel(value?: string | null): string {
    return formatDate(value);
  }

  protected formatStatus(status: string): string {
    return formatAppointmentStatus(status);
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
}
