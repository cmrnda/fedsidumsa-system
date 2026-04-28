import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PositionGroup } from '../../../../shared/types/organization.types';
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
  selector: 'app-position-groups-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, StatusBadgeComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Grupos de cargo" description="Clasifique cargos por grupos sin cargar la pantalla con formulario y tabla al mismo tiempo.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">category</span>
          Nuevo grupo
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Grupos registrados" [value]="groups().length" icon="category" tone="slate" />
        <ui-summary-card label="Activos" [value]="activeCount()" icon="task_alt" tone="emerald" />
        <ui-summary-card label="Con descripción" [value]="describedCount()" icon="notes" tone="cyan" />
      </div>

      <ui-section-card title="Listado principal" description="Revise nombres y descripciones. El registro de nuevos grupos queda separado en un panel lateral." icon="view_list">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadGroups()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!groups().length" emptyMessage="No hay grupos registrados.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Descripción</th>
                  <th class="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedGroups().items" class="align-top">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ item.description || '—' }}</td>
                  <td class="px-4 py-3">
                    <ui-status-badge [label]="item.is_active ? 'Activo' : 'Inactivo'" [tone]="item.is_active ? 'emerald' : 'amber'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedGroups().page"
            [pages]="paginatedGroups().pages"
            [perPage]="paginatedGroups().perPage"
            [total]="paginatedGroups().total"
            [start]="paginatedGroups().start"
            [end]="paginatedGroups().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nuevo grupo"
        title="Registrar grupo de cargo"
        description="Cree grupos reutilizables para simplificar reglas, cargos y validaciones posteriores."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <input formControlName="name" type="text" placeholder="Nombre del grupo" class="app-field" />
          <textarea formControlName="description" rows="4" placeholder="Descripción" class="app-field"></textarea>

          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input formControlName="is_active" type="checkbox" />
            Activo
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar el grupo" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Grupo registrado" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar grupo' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class PositionGroupsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly groups = signal<PositionGroup[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly paginatedGroups = computed(() =>
    paginateItems(this.groups(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadGroups();
  }

  protected activeCount(): number {
    return this.groups().filter((item) => item.is_active).length;
  }

  protected describedCount(): number {
    return this.groups().filter((item) => !!item.description).length;
  }

  loadGroups(): void {
    this.organizationalApi.getPositionGroups().subscribe({
      next: (response) => this.groups.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.organizationalApi.createPositionGroup(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Grupo de cargo registrado correctamente.');
        this.form.reset({
          name: '',
          description: '',
          is_active: true,
        });
        this.loadGroups();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el grupo de cargo.'));
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
