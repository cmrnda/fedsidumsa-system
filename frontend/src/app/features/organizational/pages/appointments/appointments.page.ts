import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Teacher } from '../../../../shared/types/teacher.types';
import {
  Appointment,
  ManagementPeriod,
  Position,
  SupportingDocument,
} from '../../../../shared/types/organization.types';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../data-access/organizational.api';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Organizational</p>
        <h1 class="text-2xl font-bold text-slate-900">Appointments</h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[420px,1fr]">
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Create appointment</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-5 space-y-4">
            <select formControlName="teacher_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Select teacher</option>
              <option *ngFor="let item of teachers()" [ngValue]="item.id">
                {{ item.first_names }} {{ item.last_names }}
              </option>
            </select>

            <select formControlName="period_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Select period</option>
              <option *ngFor="let item of periods()" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <select formControlName="position_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Select position</option>
              <option *ngFor="let item of positions()" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <select formControlName="supporting_document_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Select supporting document</option>
              <option *ngFor="let item of documents()" [ngValue]="item.id">
                {{ item.document_type }} {{ item.document_number || '' }}
              </option>
            </select>

            <input formControlName="start_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input formControlName="end_date" type="date" class="w-full rounded-xl border border-slate-300 px-4 py-3" />

            <select formControlName="status" class="w-full rounded-xl border border-slate-300 px-4 py-3">
              <option value="active">active</option>
              <option value="finished">finished</option>
              <option value="revoked">revoked</option>
              <option value="cancelled">cancelled</option>
            </select>

            <label class="flex items-center gap-3 text-sm text-slate-700">
              <input formControlName="is_signer" type="checkbox" />
              Signer
            </label>

            <textarea formControlName="observation" rows="4" placeholder="Observation" class="w-full rounded-xl border border-slate-300 px-4 py-3"></textarea>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ success() }}</div>
            }

            <button type="submit" [disabled]="form.invalid || loading()" class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white">
              {{ loading() ? 'Saving...' : 'Create appointment' }}
            </button>
          </form>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Appointments list</h2>
            <button type="button" (click)="loadAll()" class="rounded-xl border border-slate-300 px-4 py-2 text-sm">Refresh</button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3">Teacher</th>
                  <th class="px-4 py-3">Period</th>
                  <th class="px-4 py-3">Position</th>
                  <th class="px-4 py-3">Start</th>
                  <th class="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of appointments()">
                  <td class="px-4 py-3">{{ teacherLabel(item.teacher_id) }}</td>
                  <td class="px-4 py-3">{{ periodLabel(item.period_id) }}</td>
                  <td class="px-4 py-3">{{ positionLabel(item.position_id) }}</td>
                  <td class="px-4 py-3">{{ item.start_date }}</td>
                  <td class="px-4 py-3">{{ item.status }}</td>
                </tr>
              </tbody>
            </table>

            @if (!appointments().length) {
              <div class="py-6 text-center text-sm text-slate-500">No appointments found</div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AppointmentsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teachersApi = inject(TeachersApi);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly periods = signal<ManagementPeriod[]>([]);
  protected readonly positions = signal<Position[]>([]);
  protected readonly documents = signal<SupportingDocument[]>([]);
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly form = this.fb.group({
    teacher_id: [null as number | null, [Validators.required]],
    period_id: [null as number | null, [Validators.required]],
    position_id: [null as number | null, [Validators.required]],
    supporting_document_id: [null as number | null],
    start_date: ['', [Validators.required]],
    end_date: [''],
    status: ['active', [Validators.required]],
    is_signer: [false, [Validators.required]],
    observation: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachers.set(response.data),
    });

    this.organizationalApi.getPeriods().subscribe({
      next: (response) => this.periods.set(response.data),
    });

    this.organizationalApi.getPositions().subscribe({
      next: (response) => this.positions.set(response.data),
    });

    this.organizationalApi.getDocuments().subscribe({
      next: (response) => this.documents.set(response.data),
    });

    this.organizationalApi.getAppointments().subscribe({
      next: (response) => this.appointments.set(response.data),
    });
  }

  teacherLabel(id: number): string {
    const teacher = this.teachers().find((item) => item.id === id);
    return teacher ? `${teacher.first_names} ${teacher.last_names}` : '—';
  }

  periodLabel(id: number): string {
    return this.periods().find((item) => item.id === id)?.name || '—';
  }

  positionLabel(id: number): string {
    return this.positions().find((item) => item.id === id)?.name || '—';
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();

    this.organizationalApi.createAppointment({
      teacher_id: Number(raw.teacher_id),
      period_id: Number(raw.period_id),
      position_id: Number(raw.position_id),
      supporting_document_id: raw.supporting_document_id ? Number(raw.supporting_document_id) : null,
      start_date: raw.start_date || '',
      end_date: raw.end_date || null,
      status: raw.status || 'active',
      is_signer: !!raw.is_signer,
      observation: raw.observation || null,
    }).subscribe({
      next: () => {
        this.success.set('Appointment created successfully');
        this.form.reset({
          teacher_id: null,
          period_id: null,
          position_id: null,
          supporting_document_id: null,
          start_date: '',
          end_date: '',
          status: 'active',
          is_signer: false,
          observation: '',
        });
        this.loadAll();
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(errorResponse?.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }
}