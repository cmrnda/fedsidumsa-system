import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OrganizationalInstance } from '../../../../shared/types/organization.types';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-instances-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organizational</p>
        <h1 class="text-2xl font-bold text-slate-900">Organizational instances</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Create instance</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="code" type="text" placeholder="Code" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="name" type="text" placeholder="Name" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="level" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="university">university</option>
              <option value="faculty">faculty</option>
              <option value="career">career</option>
              <option value="federation">federation</option>
              <option value="association">association</option>
              <option value="other">other</option>
            </select>

            <select formControlName="instance_type" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="teacher_representation">teacher_representation</option>
              <option value="academic_authority">academic_authority</option>
              <option value="union_organization">union_organization</option>
              <option value="committee">committee</option>
              <option value="other">other</option>
            </select>

            <label class="flex items-center gap-3 text-sm text-slate-700">
              <input formControlName="is_active" type="checkbox" />
              Active
            </label>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Saving...' : 'Create instance' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Instances list</h2>
            <button type="button" (click)="loadInstances()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Refresh</button>
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
                  <td class="px-4 py-3">{{ item.level }}</td>
                  <td class="px-4 py-3">{{ item.instance_type }}</td>
                </tr>
              </tbody>
            </table>

            @if (!instances().length) {
              <div class="py-6 text-center text-sm text-slate-500">No instances found</div>
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
        this.success.set('Instance created successfully');
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
        this.error.set(errorResponse?.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }
}