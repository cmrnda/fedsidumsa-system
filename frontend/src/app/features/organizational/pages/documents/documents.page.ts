import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SupportingDocument } from '../../../../shared/types/organization.types';
import {
  documentTypeOptions,
  formatApiError,
  formatDate,
  formatDocumentType,
} from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InlineAlertComponent, PageHeaderComponent, PaginationComponent, SectionCardComponent, SlideOverComponent, SummaryCardComponent, TableShellComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header eyebrow="Configuración organizacional" title="Documentos de respaldo" description="Centralice documentos institucionales y mantenga el alta rápida fuera del listado principal.">
        <button
          header-actions
          type="button"
          (click)="drawerOpen.set(true)"
          class="app-button-primary"
        >
          <span class="material-symbols-rounded text-[18px]">note_add</span>
          Nuevo documento
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ui-summary-card label="Documentos registrados" [value]="documents().length" icon="folder_managed" tone="slate" />
        <ui-summary-card label="Con fecha" [value]="datedCount()" icon="today" tone="cyan" />
        <ui-summary-card label="Tipos distintos" [value]="typeCount()" icon="description" tone="amber" />
      </div>

      <ui-section-card title="Listado principal" description="Revise tipo, fecha y numeración de cada documento sin mezclar el formulario en la misma pantalla." icon="folder_copy">
        <div section-actions class="flex gap-3">
          <button type="button" (click)="loadDocuments()" class="app-button-secondary">Actualizar</button>
        </div>

        <ui-table-shell [empty]="!documents().length" emptyMessage="No hay documentos registrados.">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Tipo</th>
                  <th class="px-4 py-3">Número</th>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3">Descripción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of paginatedDocuments().items">
                  <td class="px-4 py-3">{{ formatType(item.document_type) }}</td>
                  <td class="px-4 py-3">{{ item.document_number || '—' }}</td>
                  <td class="px-4 py-3">{{ item.document_date ? formatDateLabel(item.document_date) : '—' }}</td>
                  <td class="px-4 py-3">{{ item.description || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedDocuments().page"
            [pages]="paginatedDocuments().pages"
            [perPage]="paginatedDocuments().perPage"
            [total]="paginatedDocuments().total"
            [start]="paginatedDocuments().start"
            [end]="paginatedDocuments().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
        </ui-table-shell>
      </ui-section-card>

      <ui-slide-over
        [open]="drawerOpen()"
        eyebrow="Nuevo documento"
        title="Registrar documento de respaldo"
        description="Cargue los datos mínimos para dejar disponible el documento en designaciones y certificados."
        (closed)="closeDrawer()"
      >
        <form [formGroup]="form" class="space-y-4">
          <select formControlName="document_type" class="app-field">
            @for (option of documentTypeOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <input formControlName="document_number" type="text" placeholder="Número del documento" class="app-field" />
          <input formControlName="document_date" type="date" class="app-field" />
          <textarea formControlName="description" rows="4" placeholder="Descripción" class="app-field"></textarea>

          @if (error()) {
            <ui-inline-alert title="No se pudo registrar el documento" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Documento registrado" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" (click)="closeDrawer()" class="app-button-secondary">Cancelar</button>
          <button type="button" (click)="submit()" [disabled]="form.invalid || loading()" class="app-button-primary">
            {{ loading() ? 'Guardando...' : 'Registrar documento' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class DocumentsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly documents = signal<SupportingDocument[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly documentTypeOptions = documentTypeOptions;
  protected readonly paginatedDocuments = computed(() =>
    paginateItems(this.documents(), this.tablePage(), this.perPage()),
  );

  protected readonly form = this.fb.nonNullable.group({
    document_type: ['resolution', [Validators.required]],
    document_number: [''],
    document_date: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  protected datedCount(): number {
    return this.documents().filter((item) => !!item.document_date).length;
  }

  protected typeCount(): number {
    return new Set(this.documents().map((item) => item.document_type)).size;
  }

  loadDocuments(): void {
    this.organizationalApi.getDocuments().subscribe({
      next: (response) => this.documents.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    this.organizationalApi.createDocument({
      document_type: raw.document_type,
      document_number: raw.document_number || null,
      document_date: raw.document_date || null,
      description: raw.description || null,
    }).subscribe({
      next: () => {
        this.success.set('Documento registrado correctamente.');
        this.form.reset({
          document_type: 'resolution',
          document_number: '',
          document_date: '',
          description: '',
        });
        this.loadDocuments();
        this.drawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el documento.'));
        this.loading.set(false);
      },
    });
  }

  protected formatType(value: string): string {
    return formatDocumentType(value);
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
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
