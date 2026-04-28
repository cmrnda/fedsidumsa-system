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
import { EmptyStateComponent } from '../../../../shared/ui/empty-state.component';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { ToolbarComponent } from '../../../../shared/ui/toolbar.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../data-access/teachers.api';

@Component({
  selector: 'app-teachers-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmptyStateComponent,
    InlineAlertComponent,
    PageHeaderComponent,
    PaginationComponent,
    SectionCardComponent,
    SlideOverComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    TableShellComponent,
    ToolbarComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Módulo de docentes"
        title="Búsqueda, registro y revisión rápida"
        description="La vista principal prioriza encontrar al docente correcto. El alta se resuelve en un panel lateral más simple y con menos ruido visual."
      >
        <div header-actions class="flex flex-wrap gap-3">
          <button
            type="button"
            (click)="drawerOpen.set(true)"
            class="app-button-primary"
          >
            <span class="material-symbols-rounded text-[18px]">person_add</span>
            Nuevo docente
          </button>
        </div>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Total registrados" [value]="teachers().length" icon="groups" tone="slate" />
        <ui-summary-card label="Activos" [value]="activeTeachersCount()" icon="verified" tone="emerald" />
        <ui-summary-card label="Mostrados" [value]="filteredTeachers().length" icon="filter_alt" tone="amber" />
      </div>

      <ui-section-card title="Listado principal" description="Busque por nombre, CI o estado antes de registrar un nuevo docente." icon="groups">
        <ui-toolbar>
          <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="flex flex-col gap-3 md:flex-row">
              <label class="block min-w-[240px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
                <input
                  [value]="searchTerm()"
                  (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())"
                  type="text"
                  placeholder="Ej. Pérez o 1234567"
                  class="app-field"
                />
              </label>

              <label class="block min-w-[220px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Filtrar por estado</span>
                <select
                  [value]="statusFilter()"
                  (change)="statusFilter.set($any($event.target).value)"
                  class="app-field"
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
                class="app-button-secondary"
              >
                <span class="material-symbols-rounded text-[18px]">refresh</span>
                Actualizar
              </button>
            </div>
          </div>
        </ui-toolbar>

        <div class="mt-5">
          <ui-table-shell [empty]="!filteredTeachers().length" emptyMessage="No se encontraron docentes con los filtros actuales.">
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
              @for (teacher of paginatedTeachers().items; track teacher.id) {
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
                    <ui-status-badge
                      [label]="formatStatus(teacher.status)"
                      [tone]="teacher.status === 'active' ? 'emerald' : teacher.status === 'inactive' ? 'amber' : 'slate'"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <ui-pagination
            [page]="paginatedTeachers().page"
            [pages]="paginatedTeachers().pages"
            [perPage]="paginatedTeachers().perPage"
            [total]="paginatedTeachers().total"
            [start]="paginatedTeachers().start"
            [end]="paginatedTeachers().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
          </ui-table-shell>
        </div>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nuevo docente"
        title="Registro rápido"
        description="Complete los datos mínimos. El resto puede ampliarse después sin perder el flujo principal."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">CI</span>
              <input formControlName="ci" type="text" placeholder="Ej. 1234567" class="app-field" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Complemento</span>
              <input formControlName="ci_extension" type="text" placeholder="LP, CBBA, etc." class="app-field" />
            </label>
          </div>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Nombres</span>
            <input formControlName="first_names" type="text" placeholder="Nombres del docente" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Apellidos</span>
            <input formControlName="last_names" type="text" placeholder="Apellidos del docente" class="app-field" />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
              <input formControlName="email" type="email" placeholder="docente@umsa.bo" class="app-field" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Teléfono</span>
              <input formControlName="phone" type="text" placeholder="Número de contacto" class="app-field" />
            </label>
          </div>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
            <select formControlName="status" class="app-field">
              @for (option of teacherStatusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Registro correcto" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">
            Cancelar
          </button>
          <button
            type="button"
            (click)="submit()"
            [disabled]="form.invalid || loading()"
            class="app-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span class="material-symbols-rounded text-[18px]">{{ loading() ? 'progress_activity' : 'save' }}</span>
            {{ loading() ? 'Guardando...' : 'Registrar docente' }}
          </button>
        </div>
      </ui-slide-over>
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
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
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
  protected readonly paginatedTeachers = computed(() =>
    paginateItems(this.filteredTeachers(), this.tablePage(), this.perPage()),
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

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.error.set('');
    this.success.set('');
  }

  protected updatePerPage(value: number): void {
    this.perPage.set(value);
    this.tablePage.set(1);
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
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el docente.'));
        this.loading.set(false);
      },
    });
  }
}
