import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../../organizational/data-access/organizational.api';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <article class="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Panel principal</p>
          <h1 class="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Gestión simple para personal administrativo
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            Use este panel para registrar docentes, preparar la estructura organizativa y validar designaciones sin perderse entre módulos técnicos.
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <a
              routerLink="/teachers"
              class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <span class="material-symbols-rounded text-[18px]">groups</span>
              Ir a docentes
            </a>
            <a
              routerLink="/organizational/appointments"
              class="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              <span class="material-symbols-rounded text-[18px]">assignment_ind</span>
              Probar designaciones
            </a>
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Flujo recomendado</p>
          <ol class="mt-4 space-y-4 text-sm text-slate-700">
            <li class="flex gap-3">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">1</span>
              <span>Registre o ubique al docente en el módulo <strong>Docentes</strong>.</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">2</span>
              <span>Verifique periodo, instancia, grupo y cargo en los módulos organizativos.</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">3</span>
              <span>Cree la designación y revise si existe incompatibilidad antes de guardar.</span>
            </li>
          </ol>
        </article>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Docentes</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ teachersCount() }}</p>
            </div>
            <span class="material-symbols-rounded rounded-2xl bg-cyan-50 p-3 text-cyan-700">groups</span>
          </div>
        </article>

        <article class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Periodos</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ periodsCount() }}</p>
            </div>
            <span class="material-symbols-rounded rounded-2xl bg-amber-50 p-3 text-amber-700">calendar_month</span>
          </div>
        </article>

        <article class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Cargos</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ positionsCount() }}</p>
            </div>
            <span class="material-symbols-rounded rounded-2xl bg-emerald-50 p-3 text-emerald-700">badge</span>
          </div>
        </article>

        <article class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Designaciones</p>
              <p class="mt-2 text-3xl font-bold text-slate-950">{{ appointmentsCount() }}</p>
            </div>
            <span class="material-symbols-rounded rounded-2xl bg-rose-50 p-3 text-rose-700">assignment_ind</span>
          </div>
        </article>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        @for (action of quickActions; track action.link) {
          <a
            [routerLink]="action.link"
            class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-950">{{ action.title }}</h2>
                <p class="mt-2 text-sm leading-6 text-slate-600">{{ action.description }}</p>
              </div>
              <span class="material-symbols-rounded rounded-2xl bg-slate-100 p-3 text-slate-700">
                {{ action.icon }}
              </span>
            </div>
          </a>
        }
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
  protected readonly quickActions: QuickAction[] = [
    {
      title: 'Registrar docente',
      description: 'Alta rápida de docentes con datos básicos y estado actual.',
      icon: 'person_add',
      link: '/teachers',
    },
    {
      title: 'Configurar estructura',
      description: 'Revise periodos, instancias, grupos y cargos antes de designar.',
      icon: 'lan',
      link: '/organizational/positions',
    },
    {
      title: 'Validar incompatibilidades',
      description: 'Compruebe reglas y designaciones activas desde un solo flujo.',
      icon: 'fact_check',
      link: '/organizational/appointments',
    },
  ];

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
