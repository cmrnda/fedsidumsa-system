import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  OrganizationalInstance,
  Position,
  PositionGroup,
} from '../../../../shared/types/organization.types';
import { formatApiError } from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-positions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Cargos</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar cargo</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <select formControlName="instance_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione una instancia</option>
              <option *ngFor="let item of instances()" [ngValue]="item.id">{{ item.code }} - {{ item.name }}</option>
            </select>

            <select formControlName="position_group_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione un grupo de cargo</option>
              <option *ngFor="let item of groups()" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <input formControlName="name" type="text" placeholder="Nombre del cargo" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <label class="flex items-center gap-3 text-sm text-slate-700">
              <input formControlName="is_exclusive" type="checkbox" />
              Exclusivo
            </label>

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
              {{ loading() ? 'Guardando...' : 'Registrar cargo' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de cargos</h2>
            <button type="button" (click)="loadAll()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Cargo</th>
                  <th class="px-4 py-3">Instancia</th>
                  <th class="px-4 py-3">Grupo</th>
                  <th class="px-4 py-3">Exclusivo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of positions()">
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ instanceLabel(item.instance_id) }}</td>
                  <td class="px-4 py-3">{{ groupLabel(item.position_group_id) }}</td>
                  <td class="px-4 py-3">{{ item.is_exclusive ? 'Sí' : 'No' }}</td>
                </tr>
              </tbody>
            </table>

            @if (!positions().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay cargos registrados</div>
            }
          </div>
        </div>
      </div>
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
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar el cargo.'));
        this.loading.set(false);
      },
    });
  }
}
