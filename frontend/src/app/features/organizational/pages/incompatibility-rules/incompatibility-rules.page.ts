import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  IncompatibilityRule,
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
  selector: 'app-incompatibility-rules-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, StatusBadgeComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Reglas de incompatibilidad" description="Mantenga visibles las restricciones entre grupos sin sobrecargar la pantalla con el formulario principal.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">rule</span>
          Nueva regla
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Reglas registradas" [value]="rules().length" icon="rule" tone="slate" />
        <ui-summary-card label="Activas" [value]="activeCount()" icon="task_alt" tone="emerald" />
        <ui-summary-card label="Grupos involucrados" [value]="involvedGroupsCount()" icon="category" tone="amber" />
      </div>

      <ui-section-card title="Listado principal" description="Revise qué grupos no pueden superponerse. La creación queda en un panel aparte para evitar una pantalla técnica." icon="gavel">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadAll()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!rules().length" emptyMessage="No hay reglas registradas.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Grupo origen</th>
                  <th class="px-4 py-3">Grupo destino</th>
                  <th class="px-4 py-3">Motivo</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedRules().items">
                  <td class="px-4 py-3">{{ groupLabel(item.origin_group_id) }}</td>
                  <td class="px-4 py-3">{{ groupLabel(item.target_group_id) }}</td>
                  <td class="px-4 py-3">{{ item.reason || '—' }}</td>
                  <td class="px-4 py-3">
                    <ui-status-badge [label]="item.is_active ? 'Activa' : 'Inactiva'" [tone]="item.is_active ? 'emerald' : 'amber'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedRules().page"
            [pages]="paginatedRules().pages"
            [perPage]="paginatedRules().perPage"
            [total]="paginatedRules().total"
            [start]="paginatedRules().start"
            [end]="paginatedRules().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nueva regla"
        title="Registrar incompatibilidad"
        description="Defina qué grupos no pueden coexistir para que designaciones y validaciones usen esta regla automáticamente."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <select formControlName="origin_group_id" class="app-field">
            <option [ngValue]="null">Seleccione el grupo origen</option>
            <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
          </select>

          <select formControlName="target_group_id" class="app-field">
            <option [ngValue]="null">Seleccione el grupo destino</option>
            <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
          </select>

          <textarea formControlName="reason" rows="4" placeholder="Motivo" class="app-field"></textarea>

          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input formControlName="is_active" type="checkbox" />
            Activa
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar la regla" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Regla registrada" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar regla' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class IncompatibilityRulesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly groups = signal<PositionGroup[]>([]);
  protected readonly rules = signal<IncompatibilityRule[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly paginatedRules = computed(() =>
    paginateItems(this.rules(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.group({
    origin_group_id: [null as number | null, [Validators.required]],
    target_group_id: [null as number | null, [Validators.required]],
    reason: [''],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected activeCount(): number {
    return this.rules().filter((item) => item.is_active).length;
  }

  protected involvedGroupsCount(): number {
    return new Set(this.rules().flatMap((item) => [item.origin_group_id, item.target_group_id])).size;
  }

  loadAll(): void {
    this.organizationalApi.getPositionGroups().subscribe({
      next: (response) => this.groups.set(response.data),
    });

    this.organizationalApi.getIncompatibilityRules().subscribe({
      next: (response) => this.rules.set(response.data),
    });
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

    this.organizationalApi.createIncompatibilityRule({
      origin_group_id: Number(raw.origin_group_id),
      target_group_id: Number(raw.target_group_id),
      reason: raw.reason || null,
      is_active: !!raw.is_active,
    }).subscribe({
      next: () => {
        this.success.set('Regla registrada correctamente.');
        this.form.reset({
          origin_group_id: null,
          target_group_id: null,
          reason: '',
          is_active: true,
        });
        this.loadAll();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar la regla.'));
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
