import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Teacher } from '../../../../shared/types/teacher.types';
import {
  formatApiError,
  formatFullName,
  formatTeacherStatus,
  teacherStatusOptions,
} from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../data-access/teachers.api';

@Component({
  selector: 'app-teachers-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div class="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Módulo de docentes</p>
          <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Registro claro y rápido de docentes</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Este módulo está pensado para que administración pueda crear, revisar y ubicar docentes sin navegar entre pantallas innecesarias.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Total registrados</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ teachers().length }}</p>
            </div>
            <div class="rounded-2xl bg-emerald-50 p-4">
              <p class="text-sm text-emerald-700">Activos</p>
              <p class="mt-2 text-2xl font-bold text-emerald-900">{{ activeTeachersCount() }}</p>
            </div>
            <div class="rounded-2xl bg-amber-50 p-4">
              <p class="text-sm text-amber-700">Mostrados</p>
              <p class="mt-2 text-2xl font-bold text-amber-900">{{ filteredTeachers().length }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Uso recomendado</p>
          <ul class="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-cyan-700">badge</span>
              Registre primero el CI, nombres y apellidos para evitar duplicados.
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-cyan-700">alternate_email</span>
              Correo y teléfono son útiles para ubicar rápidamente a la persona.
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-cyan-700">assignment_ind</span>
              Luego use el docente creado en el flujo de designaciones.
            </li>
          </ul>
        </article>
      </div>

      <div class="grid gap-6 xl:grid-cols-[420px,1fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="material-symbols-rounded rounded-2xl bg-cyan-50 p-3 text-cyan-700">person_add</span>
            <div>
              <h2 class="text-xl font-bold text-slate-950">Nuevo docente</h2>
              <p class="text-sm text-slate-500">Complete solo los datos necesarios para comenzar.</p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">CI</span>
                <input formControlName="ci" type="text" placeholder="Ej. 1234567" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Complemento</span>
                <input formControlName="ci_extension" type="text" placeholder="LP, CBBA, etc." class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Nombres</span>
              <input formControlName="first_names" type="text" placeholder="Nombres del docente" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Apellidos</span>
              <input formControlName="last_names" type="text" placeholder="Apellidos del docente" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
                <input formControlName="email" type="email" placeholder="docente@umsa.bo" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Teléfono</span>
                <input formControlName="phone" type="text" placeholder="Número de contacto" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
            </div>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
              <select formControlName="status" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
                @for (option of teacherStatusOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
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
              [disabled]="form.invalid || loading()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="material-symbols-rounded text-[18px]">{{ loading() ? 'progress_activity' : 'save' }}</span>
              {{ loading() ? 'Guardando...' : 'Registrar docente' }}
            </button>
          </form>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="text-xl font-bold text-slate-950">Listado de docentes</h2>
              <p class="text-sm text-slate-500">Busque por nombre, apellido, CI o estado.</p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <label class="block min-w-[240px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
                <input
                  [value]="searchTerm()"
                  (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())"
                  type="text"
                  placeholder="Ej. Pérez o 1234567"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label class="block min-w-[220px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Filtrar por estado</span>
                <select
                  [value]="statusFilter()"
                  (change)="statusFilter.set($any($event.target).value)"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Todos</option>
                  @for (option of teacherStatusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <button
                type="button"
                (click)="loadTeachers()"
                class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
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
                    <th class="px-4 py-3 font-semibold">CI</th>
                    <th class="px-4 py-3 font-semibold">Contacto</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (teacher of filteredTeachers(); track teacher.id) {
                    <tr class="align-top">
                      <td class="px-4 py-4">
                        <p class="font-semibold text-slate-950">{{ fullName(teacher) }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ teacher.teacher_code || 'Sin código interno' }}
                        </p>
                      </td>
                      <td class="px-4 py-4 text-slate-700">
                        {{ teacher.ci }} {{ teacher.ci_extension || '' }}
                      </td>
                      <td class="px-4 py-4 text-slate-700">
                        <p>{{ teacher.email || 'Sin correo' }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ teacher.phone || 'Sin teléfono' }}</p>
                      </td>
                      <td class="px-4 py-4">
                        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {{ formatStatus(teacher.status) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (!filteredTeachers().length) {
              <div class="px-6 py-10 text-center text-sm text-slate-500">
                No se encontraron docentes con los filtros actuales.
              </div>
            }
          </div>
        </article>
      </div>
    </section>
  `,
})
export class TeachersListPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teachersApi = inject(TeachersApi);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly teacherStatusOptions = teacherStatusOptions;
  protected readonly filteredTeachers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.teachers().filter((teacher) => {
      const matchesStatus = !status || teacher.status === status;
      const searchable = [
        formatFullName(teacher.first_names, teacher.last_names),
        teacher.ci,
        teacher.ci_extension,
        teacher.email,
        teacher.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      return matchesStatus && matchesSearch;
    });
  });
  protected readonly activeTeachersCount = computed(
    () => this.teachers().filter((teacher) => teacher.status === 'active').length,
  );

  protected readonly form = this.fb.nonNullable.group({
    ci: ['', [Validators.required]],
    ci_extension: [''],
    first_names: ['', [Validators.required]],
    last_names: ['', [Validators.required]],
    email: [''],
    phone: [''],
    status: ['active' as const, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadTeachers();
  }

  protected fullName(teacher: Teacher): string {
    return formatFullName(teacher.first_names, teacher.last_names);
  }

  protected formatStatus(status: string): string {
    return formatTeacherStatus(status);
  }

  protected loadTeachers(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachers.set(response.data),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.teachersApi.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Docente registrado correctamente.');
        this.form.reset({
          ci: '',
          ci_extension: '',
          first_names: '',
          last_names: '',
          email: '',
          phone: '',
          status: 'active',
        });
        this.loadTeachers();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el docente.'));
        this.loading.set(false);
      },
    });
  }
}
