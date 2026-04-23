import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  IncompatibilityRule,
  PositionGroup,
} from '../../../../shared/types/organization.types';
import { formatApiError } from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-incompatibility-rules-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Reglas de incompatibilidad</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar regla de incompatibilidad</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <select formControlName="origin_group_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione el grupo origen</option>
              <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <select formControlName="target_group_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione el grupo destino</option>
              <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <textarea formControlName="reason" rows="4" placeholder="Motivo" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            <label class="flex items-center gap-3 text-sm text-slate-700">
              <input formControlName="is_active" type="checkbox" />
              Activa
            </label>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Guardando...' : 'Registrar regla' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de reglas</h2>
            <button type="button" (click)="loadAll()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Grupo origen</th>
                  <th class="px-4 py-3">Grupo destino</th>
                  <th class="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of rules()">
                  <td class="px-4 py-3">{{ groupLabel(item.origin_group_id) }}</td>
                  <td class="px-4 py-3">{{ groupLabel(item.target_group_id) }}</td>
                  <td class="px-4 py-3">{{ item.reason || '—' }}</td>
                </tr>
              </tbody>
            </table>

            @if (!rules().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay reglas registradas</div>
            }
          </div>
        </div>
      </div>
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

  protected readonly form = this.fb.group({
    origin_group_id: [null as number | null, [Validators.required]],
    target_group_id: [null as number | null, [Validators.required]],
    reason: [''],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAll();
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
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar la regla.'));
        this.loading.set(false);
      },
    });
  }
}
