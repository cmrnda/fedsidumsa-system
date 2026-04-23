import { Component, OnInit, inject, signal } from '@angular/core';

import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../../organizational/data-access/organizational.api';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-medium text-slate-500">Overview</p>
        <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p class="text-sm text-slate-500">Teachers</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ teachersCount() }}</p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p class="text-sm text-slate-500">Periods</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ periodsCount() }}</p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p class="text-sm text-slate-500">Positions</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ positionsCount() }}</p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p class="text-sm text-slate-500">Appointments</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ appointmentsCount() }}</p>
        </div>
      </div>
    </section>
  `,
})
export class DashboardPage implements OnInit {
  private readonly teachersApi = inject(TeachersApi);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly teachersCount = signal(0);
  protected readonly periodsCount = signal(0);
  protected readonly positionsCount = signal(0);
  protected readonly appointmentsCount = signal(0);

  ngOnInit(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachersCount.set(response.data.length),
    });

    this.organizationalApi.getPeriods().subscribe({
      next: (response) => this.periodsCount.set(response.data.length),
    });

    this.organizationalApi.getPositions().subscribe({
      next: (response) => this.positionsCount.set(response.data.length),
    });

    this.organizationalApi.getAppointments().subscribe({
      next: (response) => this.appointmentsCount.set(response.data.length),
    });
  }
}