import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  OrganizationalInstance,
  Position,
  PositionGroup,
} from '../../../../shared/types/organization.types';
import { formatApiError, paginateItems } from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-positions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, StatusBadgeComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Cargos" description="Organice los cargos disponibles por instancia y grupo sin mezclar el alta con el listado principal.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">badge</span>
          Nuevo cargo
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ui-summary-card label="Cargos registrados" [value]="positions().length" icon="badge" tone="slate" />
        <ui-summary-card label="Exclusivos" [value]="exclusiveCount()" icon="lock" tone="amber" />
        <ui-summary-card label="Activos" [value]="activeCount()" icon="task_alt" tone="emerald" />
        <ui-summary-card label="Instancias relacionadas" [value]="instanceCount()" icon="account_tree" tone="cyan" />
      </div>

      <ui-section-card title="Listado principal" description="Revise rápidamente instancia, grupo y condición de exclusividad de cada cargo." icon="work">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadAll()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!positions().length" emptyMessage="No hay cargos registrados.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Cargo</th>
                  <th class="px-4 py-3">Instancia</th>
                  <th class="px-4 py-3">Grupo</th>
                  <th class="px-4 py-3">Exclusivo</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedPositions().items" class="align-top">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ instanceLabel(item.instance_id) }}</td>
                  <td class="px-4 py-3">{{ groupLabel(item.position_group_id) }}</td>
                  <td class="px-4 py-3">{{ item.is_exclusive ? 'Sí' : 'No' }}</td>
                  <td class="px-4 py-3">
                    <ui-status-badge [label]="item.is_active ? 'Activo' : 'Inactivo'" [tone]="item.is_active ? 'emerald' : 'amber'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedPositions().page"
            [pages]="paginatedPositions().pages"
            [perPage]="paginatedPositions().perPage"
            [total]="paginatedPositions().total"
            [start]="paginatedPositions().start"
            [end]="paginatedPositions().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nuevo cargo"
        title="Registrar cargo"
        description="Asocie el cargo a una instancia y a un grupo para que el flujo organizacional quede consistente."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <select formControlName="instance_id" class="app-field">
            <option [ngValue]="null">Seleccione una instancia</option>
            <option *ngFor="let item of instances()" [ngValue]="item.id">{{ item.code }} - {{ item.name }}</option>
          </select>

          <select formControlName="position_group_id" class="app-field">
            <option [ngValue]="null">Seleccione un grupo de cargo</option>
            <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
          </select>

          <input formControlName="name" type="text" placeholder="Nombre del cargo" class="app-field" />

          <label class="app-muted-surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
            <input formControlName="is_exclusive" type="checkbox" />
            Exclusivo
          </label>

          <label class="app-muted-surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
            <input formControlName="is_active" type="checkbox" />
            Activo
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar el cargo" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Cargo registrado" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar cargo' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class PositionsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly positions = signal<Position[]>([]);
  protected readonly instances = signal<OrganizationalInstance[]>([]);
  protected readonly groups = signal<PositionGroup[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly paginatedPositions = computed(() =>
    paginateItems(this.positions(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.group({
    instance_id: [null as number | null, [Validators.required]],
    position_group_id: [null as number | null, [Validators.required]],
    name: ['', [Validators.required]],
    is_exclusive: [true, [Validators.required]],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected exclusiveCount(): number {
    return this.positions().filter((item) => item.is_exclusive).length;
  }

  protected activeCount(): number {
    return this.positions().filter((item) => item.is_active).length;
  }

  protected instanceCount(): number {
    return new Set(this.positions().map((item) => item.instance_id)).size;
  }

  loadAll(): void {
    this.organizationalApi.getPositions().subscribe({
      next: (response) => this.positions.set(response.data),
    });

    this.organizationalApi.getInstances().subscribe({
      next: (response) => this.instances.set(response.data),
    });

    this.organizationalApi.getPositionGroups().subscribe({
      next: (response) => this.groups.set(response.data),
    });
  }

  instanceLabel(id: number): string {
    return this.instances().find((item) => item.id === id)?.name || '—';
  }

  groupLabel(id: number): string {
    return this.groups().find((item) => item.id === id)?.name || '—';
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    this.organizationalApi.createPosition({
      instance_id: Number(raw.instance_id),
      position_group_id: Number(raw.position_group_id),
      name: raw.name || '',
      is_exclusive: !!raw.is_exclusive,
      is_active: !!raw.is_active,
    }).subscribe({
      next: () => {
        this.success.set('Cargo registrado correctamente.');
        this.form.reset({
          instance_id: null,
          position_group_id: null,
          name: '',
          is_exclusive: true,
          is_active: true,
        });
        this.loadAll();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el cargo.'));
        this.loading.set(false);
      },
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
}
