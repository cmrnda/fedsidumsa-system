import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ManagementPeriod } from '../../../../shared/types/organization.types';
import {
  formatApiError,
  formatDate,
  formatPeriodStatus,
  periodStatusOptions,
} from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-periods-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Periodos de gestión</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar periodo</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="name" type="text" placeholder="Nombre del periodo" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="start_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="end_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="status" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              @for (option of periodStatusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

            <textarea formControlName="observation" rows="4" placeholder="Observación" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Guardando...' : 'Registrar periodo' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de periodos</h2>
            <button type="button" (click)="loadPeriods()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Start</th>
                  <th class="px-4 py-3">End</th>
                  <th class="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of periods()">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ formatDateLabel(item.start_date) }}</td>
                  <td class="px-4 py-3">{{ formatDateLabel(item.end_date) }}</td>
                  <td class="px-4 py-3">{{ formatStatus(item.status) }}</td>
                </tr>
              </tbody>
            </table>

            @if (!periods().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay periodos registrados</div>
            }
          </div>
        </div>
      </div>
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
  protected readonly periodStatusOptions = periodStatusOptions;

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
}
