import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OrganizationalInstance } from '../../../../shared/types/organization.types';
import {
  formatApiError,
  formatInstanceLevel,
  formatInstanceType,
  instanceLevelOptions,
  instanceTypeOptions,
} from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-instances-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, StatusBadgeComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Instancias organizacionales" description="Mantenga la estructura base ordenada y separe la creación rápida del listado operativo.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">account_tree</span>
          Nueva instancia
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Instancias registradas" [value]="instances().length" icon="account_tree" tone="slate" />
        <ui-summary-card label="Activas" [value]="activeCount()" icon="task_alt" tone="emerald" />
        <ui-summary-card label="Niveles distintos" [value]="levelCount()" icon="layers" tone="cyan" />
      </div>

      <ui-section-card title="Listado principal" description="Revise código, nivel y tipo de cada instancia. La creación queda aparte para una lectura más limpia." icon="lan">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadInstances()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!instances().length" emptyMessage="No hay instancias registradas.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Código</th>
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Nivel</th>
                  <th class="px-4 py-3">Tipo</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedInstances().items" class="align-top">
                  <td class="px-4 py-3">{{ item.code }}</td>
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ formatLevel(item.level) }}</td>
                  <td class="px-4 py-3">{{ formatType(item.instance_type) }}</td>
                  <td class="px-4 py-3">
                    <ui-status-badge [label]="item.is_active ? 'Activa' : 'Inactiva'" [tone]="item.is_active ? 'emerald' : 'amber'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedInstances().page"
            [pages]="paginatedInstances().pages"
            [perPage]="paginatedInstances().perPage"
            [total]="paginatedInstances().total"
            [start]="paginatedInstances().start"
            [end]="paginatedInstances().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nueva instancia"
        title="Registrar instancia organizacional"
        description="Defina código, nivel y tipo para que el resto de módulos pueda reutilizar esta estructura."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <input formControlName="code" type="text" placeholder="Código" class="app-field" />
          <input formControlName="name" type="text" placeholder="Nombre de la instancia" class="app-field" />

          <select formControlName="level" class="app-field">
            @for (option of instanceLevelOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <select formControlName="instance_type" class="app-field">
            @for (option of instanceTypeOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input formControlName="is_active" type="checkbox" />
            Activa
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar la instancia" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Instancia registrada" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar instancia' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class InstancesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly instances = signal<OrganizationalInstance[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly instanceLevelOptions = instanceLevelOptions;
  protected readonly instanceTypeOptions = instanceTypeOptions;
  protected readonly paginatedInstances = computed(() =>
    paginateItems(this.instances(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    level: ['university', [Validators.required]],
    instance_type: ['teacher_representation', [Validators.required]],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadInstances();
  }

  protected activeCount(): number {
    return this.instances().filter((item) => item.is_active).length;
  }

  protected levelCount(): number {
    return new Set(this.instances().map((item) => item.level)).size;
  }

  loadInstances(): void {
    this.organizationalApi.getInstances().subscribe({
      next: (response) => this.instances.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.organizationalApi.createInstance(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Instancia registrada correctamente.');
        this.form.reset({
          code: '',
          name: '',
          level: 'university',
          instance_type: 'teacher_representation',
          is_active: true,
        });
        this.loadInstances();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar la instancia.'));
        this.loading.set(false);
      },
    });
  }

  protected formatLevel(value: string): string {
    return formatInstanceLevel(value);
  }

  protected formatType(value: string): string {
    return formatInstanceType(value);
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
}
