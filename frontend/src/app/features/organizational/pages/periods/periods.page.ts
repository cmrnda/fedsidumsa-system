import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ManagementPeriod } from '../../../../shared/types/organization.types';
import {
  formatApiError,
  formatDate,
  formatPeriodStatus,
  periodStatusOptions,
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
  selector: 'app-periods-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, StatusBadgeComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Periodos de gestión" description="Defina las gestiones administrativas activas y mantenga el listado separado del alta rápida.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">calendar_add_on</span>
          Nuevo periodo
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Periodos registrados" [value]="periods().length" icon="calendar_month" tone="slate" />
        <ui-summary-card label="Activos" [value]="activeCount()" icon="event_available" tone="emerald" />
        <ui-summary-card label="Cerrados o cancelados" [value]="inactiveCount()" icon="event_busy" tone="amber" />
      </div>

      <ui-section-card title="Listado principal" description="Revise vigencia y estado de cada periodo. El alta se resuelve en un panel lateral para reducir ruido." icon="calendar_view_month">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadPeriods()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!periods().length" emptyMessage="No hay periodos registrados.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Periodo</th>
                  <th class="px-4 py-3">Inicio</th>
                  <th class="px-4 py-3">Fin</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedPeriods().items" class="align-top">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ formatDateLabel(item.start_date) }}</td>
                  <td class="px-4 py-3">{{ formatDateLabel(item.end_date) }}</td>
                  <td class="px-4 py-3">
                    <ui-status-badge
                      [label]="formatStatus(item.status)"
                      [tone]="item.status === 'active' ? 'emerald' : 'amber'"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedPeriods().page"
            [pages]="paginatedPeriods().pages"
            [perPage]="paginatedPeriods().perPage"
            [total]="paginatedPeriods().total"
            [start]="paginatedPeriods().start"
            [end]="paginatedPeriods().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nuevo periodo"
        title="Registrar periodo de gestión"
        description="Complete solo los datos necesarios para dejar la gestión lista para uso operativo."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <input formControlName="name" type="text" placeholder="Nombre del periodo" class="app-field" />
          <input formControlName="start_date" type="date" class="app-field" />
          <input formControlName="end_date" type="date" class="app-field" />

          <select formControlName="status" class="app-field">
            @for (option of periodStatusOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <textarea formControlName="observation" rows="4" placeholder="Observación" class="app-field"></textarea>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar el periodo" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Periodo registrado" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar periodo' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class PeriodsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly periods = signal<ManagementPeriod[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly periodStatusOptions = periodStatusOptions;
  protected readonly paginatedPeriods = computed(() =>
    paginateItems(this.periods(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
    status: ['active', [Validators.required]],
    observation: [''],
  });

  ngOnInit(): void {
    this.loadPeriods();
  }

  protected activeCount(): number {
    return this.periods().filter((item) => item.status === 'active').length;
  }

  protected inactiveCount(): number {
    return this.periods().filter((item) => item.status !== 'active').length;
  }

  loadPeriods(): void {
    this.organizationalApi.getPeriods().subscribe({
      next: (response) => this.periods.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.organizationalApi.createPeriod(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Periodo registrado correctamente.');
        this.form.reset({
          name: '',
          start_date: '',
          end_date: '',
          status: 'active',
          observation: '',
        });
        this.loadPeriods();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el periodo.'));
        this.loading.set(false);
      },
    });
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected formatStatus(value: string): string {
    return formatPeriodStatus(value);
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
