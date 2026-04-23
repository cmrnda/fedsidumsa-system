import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ManagementPeriod } from '../../../../shared/types/organization.types';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-periods-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organizational</p>
        <h1 class="text-2xl font-bold text-slate-900">Management periods</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Create period</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <input formControlName="name" type="text" placeholder="Name" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="start_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="end_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="status" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="active">active</option>
              <option value="closed">closed</option>
              <option value="cancelled">cancelled</option>
            </select>

            <textarea formControlName="observation" rows="4" placeholder="Observation" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Saving...' : 'Create period' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Periods list</h2>
            <button type="button" (click)="loadPeriods()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Refresh</button>
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
                  <td class="px-4 py-3">{{ item.start_date }}</td>
                  <td class="px-4 py-3">{{ item.end_date }}</td>
                  <td class="px-4 py-3">{{ item.status }}</td>
                </tr>
              </tbody>
            </table>

            @if (!periods().length) {
              <div class="py-6 text-center text-sm text-slate-500">No periods found</div>
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
        this.success.set('Period created successfully');
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
        this.error.set(errorResponse?.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }
}