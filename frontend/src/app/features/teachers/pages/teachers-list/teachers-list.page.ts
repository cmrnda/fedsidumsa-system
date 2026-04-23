import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Teacher } from '../../../../shared/types/teacher.types';
import { TeachersApi } from '../../data-access/teachers.api';

@Component({
  selector: 'app-teachers-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Teachers</p>
        <h1 class="text-2xl font-bold text-slate-900">Teacher management</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Create teacher</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="ci" type="text" placeholder="CI" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="ci_extension" type="text" placeholder="CI extension" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="first_names" type="text" placeholder="First names" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="last_names" type="text" placeholder="Last names" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="email" type="email" placeholder="Email" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="phone" type="text" placeholder="Phone" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="status" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="retired">retired</option>
              <option value="leave">leave</option>
            </select>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ error() }}
              </div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {{ success() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {{ loading() ? 'Saving...' : 'Create teacher' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Teachers list</h2>
            <button
              type="button"
              (click)="loadTeachers()"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Refresh
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">CI</th>
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Phone</th>
                  <th class="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let teacher of teachers()">
                  <td class="px-4 py-3">{{ teacher.ci }} {{ teacher.ci_extension || '' }}</td>
                  <td class="px-4 py-3">{{ teacher.first_names }} {{ teacher.last_names }}</td>
                  <td class="px-4 py-3">{{ teacher.email || '—' }}</td>
                  <td class="px-4 py-3">{{ teacher.phone || '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {{ teacher.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            @if (!teachers().length) {
              <div class="py-6 text-center text-sm text-slate-500">No teachers found</div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TeachersListPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teachersApi = inject(TeachersApi);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly form = this.fb.nonNullable.group({
    ci: ['', [Validators.required]],
    ci_extension: [''],
    first_names: ['', [Validators.required]],
    last_names: ['', [Validators.required]],
    email: [''],
    phone: [''],
    status: ['active' as const, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachers.set(response.data),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.teachersApi.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set('Teacher created successfully');
        this.form.reset({
          ci: '',
          ci_extension: '',
          first_names: '',
          last_names: '',
          email: '',
          phone: '',
          status: 'active',
        });
        this.loadTeachers();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(errorResponse?.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }
}