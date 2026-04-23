import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OrganizationalInstance } from '../../../../shared/types/organization.types';
import {
  formatApiError,
  formatInstanceLevel,
  formatInstanceType,
  instanceLevelOptions,
  instanceTypeOptions,
} from '../../../../shared/utils/ui-helpers';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-instances-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organización</p>
        <h1 class="text-2xl font-bold text-slate-900">Instancias organizacionales</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Registrar instancia</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="code" type="text" placeholder="Código" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="name" type="text" placeholder="Nombre de la instancia" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="level" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              @for (option of instanceLevelOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

            <select formControlName="instance_type" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              @for (option of instanceTypeOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>

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
              {{ loading() ? 'Guardando...' : 'Registrar instancia' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Lista de instancias</h2>
            <button type="button" (click)="loadInstances()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Actualizar</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Code</th>
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Level</th>
                  <th class="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of instances()">
                  <td class="px-4 py-3">{{ item.code }}</td>
                  <td class="px-4 py-3">{{ item.name }}</td>
                  <td class="px-4 py-3">{{ formatLevel(item.level) }}</td>
                  <td class="px-4 py-3">{{ formatType(item.instance_type) }}</td>
                </tr>
              </tbody>
            </table>

            @if (!instances().length) {
              <div class="py-6 text-center text-sm text-slate-500">No hay instancias registradas</div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class InstancesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly instances = signal<OrganizationalInstance[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly instanceLevelOptions = instanceLevelOptions;
  protected readonly instanceTypeOptions = instanceTypeOptions;

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    level: ['university', [Validators.required]],
    instance_type: ['teacher_representation', [Validators.required]],
    is_active: [true, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadInstances();
  }

  loadInstances(): void {
    this.organizationalApi.getInstances().subscribe({
      next: (response) => this.instances.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.organizationalApi.createInstance(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Instancia registrada correctamente.');
        this.form.reset({
          code: '',
          name: '',
          level: 'university',
          instance_type: 'teacher_representation',
          is_active: true,
        });
        this.loadInstances();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo registrar la instancia.'));
        this.loading.set(false);
      },
    });
  }

  protected formatLevel(value: string): string {
    return formatInstanceLevel(value);
  }

  protected formatType(value: string): string {
    return formatInstanceType(value);
  }
}
