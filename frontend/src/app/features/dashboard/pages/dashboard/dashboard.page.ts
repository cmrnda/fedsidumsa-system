import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CertificatesApi } from '../../../certificates/data-access/certificates.api';
import { DebtsApi } from '../../../debts/data-access/debts.api';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { OrganizationalApi } from '../../../organizational/data-access/organizational.api';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, SummaryCardComponent, SectionCardComponent],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Inicio operativo"
        title="Centro de operación"
        description="Resumen corto para priorizar la jornada: solicitudes, revisión, deudas y estructura disponible."
      />

      <div class="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <div class="grid gap-4 md:grid-cols-2">
          <ui-summary-card label="Certificados solicitados" [value]="requestedCertificatesCount()" icon="pending_actions" tone="amber" />
          <ui-summary-card label="En revisión" [value]="reviewCertificatesCount()" icon="fact_check" tone="cyan" />
          <ui-summary-card label="Docentes con saldo pendiente" [value]="teachersWithPendingBalance()" icon="account_balance_wallet" tone="rose" />
          <ui-summary-card label="Aptos para cert. no adeudo" [value]="teachersClearForNoDebt()" icon="verified" tone="emerald" />
        </div>

        <ui-section-card title="Siguiente revisión recomendada" description="Orden sugerido para reducir errores y evitar abrir módulos innecesarios." icon="priority_high">
          <div class="space-y-3 text-sm text-slate-700">
            <a routerLink="/certificates" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300">
              <span class="flex items-center gap-3">
                <span class="material-symbols-rounded text-amber-700">pending_actions</span>
                <span>Revisar solicitudes nuevas</span>
              </span>
              <span class="font-bold text-slate-950">{{ requestedCertificatesCount() }}</span>
            </a>
            <a routerLink="/certificates" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300">
              <span class="flex items-center gap-3">
                <span class="material-symbols-rounded text-cyan-700">fact_check</span>
                <span>Resolver trámites en revisión</span>
              </span>
              <span class="font-bold text-slate-950">{{ reviewCertificatesCount() }}</span>
            </a>
            <a routerLink="/debts" class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300">
              <span class="flex items-center gap-3">
                <span class="material-symbols-rounded text-rose-700">account_balance_wallet</span>
                <span>Validar docentes con saldo pendiente</span>
              </span>
              <span class="font-bold text-slate-950">{{ teachersWithPendingBalance() }}</span>
            </a>
          </div>
        </ui-section-card>
      </div>

      <div class="grid gap-5 xl:grid-cols-[0.92fr,1.08fr]">
        <ui-section-card title="Base administrativa disponible" description="Datos base cargados para operar sin salir del inicio." icon="inventory_2">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-sm text-slate-500">Docentes</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ teachersCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-sm text-slate-500">Periodos</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ periodsCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-sm text-slate-500">Cargos</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ positionsCount() }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-sm text-slate-500">Designaciones</p>
              <p class="mt-2 text-2xl font-bold text-slate-950">{{ appointmentsCount() }}</p>
            </div>
          </div>
        </ui-section-card>

        <ui-section-card title="Accesos rápidos" description="Atajos útiles para seguir trabajando sin volver al menú." icon="flash_on">
          <div class="grid gap-4 md:grid-cols-2">
            @for (action of quickActions; track action.link) {
              <a
                [routerLink]="action.link"
                class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h2 class="font-bold text-slate-950">{{ action.title }}</h2>
                    <p class="mt-1 text-sm leading-6 text-slate-600">{{ action.description }}</p>
                  </div>
                  <span class="material-symbols-rounded rounded-xl bg-slate-100 p-2.5 text-slate-700">
                    {{ action.icon }}
                  </span>
                </div>
              </a>
            }
          </div>
        </ui-section-card>
      </div>
    </section>
  `,
})
export class DashboardPage implements OnInit {
  private readonly teachersApi = inject(TeachersApi);
  private readonly organizationalApi = inject(OrganizationalApi);
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly debtsApi = inject(DebtsApi);

  protected readonly teachersCount = signal(0);
  protected readonly periodsCount = signal(0);
  protected readonly positionsCount = signal(0);
  protected readonly appointmentsCount = signal(0);
  protected readonly requestedCertificatesCount = signal(0);
  protected readonly reviewCertificatesCount = signal(0);
  protected readonly teachersWithPendingBalance = signal(0);
  protected readonly teachersClearForNoDebt = signal(0);
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
    {
      title: 'Estado financiero',
      description: 'Consulte estado de cuenta y aptitud para certificados de no adeudo.',
      icon: 'account_balance_wallet',
      link: '/debts',
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

    this.certificatesApi.getCertificates().subscribe({
      next: (response) => {
        this.requestedCertificatesCount.set(
          response.data.filter((item) => item.status === 'requested').length,
        );
        this.reviewCertificatesCount.set(
          response.data.filter((item) => item.status === 'under_review').length,
        );
      },
    });

    this.debtsApi.getDashboardSummary().subscribe({
      next: (response) => {
        this.teachersWithPendingBalance.set(response.data.teachers_with_pending_balance);
        this.teachersClearForNoDebt.set(response.data.teachers_clear_for_no_debt);
      },
    });
  }
}
