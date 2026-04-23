import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PositionGroup } from '../../../../shared/types/organization.types';
import { formatApiError } from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-position-groups-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Grupos de cargo</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar grupo de cargo</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="name" type="text" placeholder="Nombre del grupo" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <textarea formControlName="description" rows="4" placeholder="Descripción" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            <label class="flex items-center gap-3 text-sm text-slate-700">
              <input formControlName="is_active" type="checkbox" />
              Activo
            </label>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Guardando...' : 'Registrar grupo' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de grupos</h2>
            <button type="button" (click)="loadGroups()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of groups()">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ item.description || '—' }}</td>
                </tr>
              </tbody>
            </table>

            @if (!groups().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay grupos registrados</div>
            }
          </div>
        </div>
      </div>
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

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadGroups();
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
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el grupo de cargo.'));
        this.loading.set(false);
      },
    });
  }
}
