import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SupportingDocument } from '../../../../shared/types/organization.types';
import {
  documentTypeOptions,
  formatApiError,
  formatDate,
  formatDocumentType,
} from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Documentos de respaldo</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar documento</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <select formControlName="document_type" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              @for (option of documentTypeOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

            <input formControlName="document_number" type="text" placeholder="Número del documento" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="document_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <textarea formControlName="description" rows="4" placeholder="Descripción" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Guardando...' : 'Registrar documento' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de documentos</h2>
            <button type="button" (click)="loadDocuments()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Type</th>
                  <th class="px-4 py-3">Number</th>
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of documents()">
                  <td class="px-4 py-3">{{ formatType(item.document_type) }}</td>
                  <td class="px-4 py-3">{{ item.document_number || '—' }}</td>
                  <td class="px-4 py-3">{{ item.document_date ? formatDateLabel(item.document_date) : '—' }}</td>
                  <td class="px-4 py-3">{{ item.description || '—' }}</td>
                </tr>
              </tbody>
            </table>

            @if (!documents().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay documentos registrados</div>
            }
          </div>
        </div>
      </div>
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
  protected readonly documentTypeOptions = documentTypeOptions;

  protected readonly form = this.fb.nonNullable.group({
    document_type: ['resolution', [Validators.required]],
    document_number: [''],
    document_date: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.loadDocuments();
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
}
