import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UiFeedbackService } from '../../../../core/services/ui-feedback.service';
import {
  ObligationConcept,
  TeacherObligation,
  TeacherStatement,
} from '../../../../shared/types/debt.types';
import { Teacher } from '../../../../shared/types/teacher.types';
import {
  formatApiError,
  formatDate,
  formatFullName,
  formatObligationStatus,
} from '../../../../shared/utils/ui-helpers';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state.component';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { paginateItems } from '../../../../shared/utils/ui-helpers';
import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { DebtsApi } from '../../data-access/debts.api';

@Component({
  selector: 'app-debts-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    InlineAlertComponent,
    PageHeaderComponent,
    PaginationComponent,
    SectionCardComponent,
    SlideOverComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    TableShellComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Validación financiera"
        title="Estado de cuenta de soporte para certificados"
        description="Este módulo no emite documentos. Solo concentra el estado financiero que respalda la elegibilidad del certificado de no adeudo."
      >
        <a
          header-actions
          routerLink="/certificates"
          class="app-button-secondary"
        >
          <span class="material-symbols-rounded text-[18px]">workspace_premium</span>
          Ir a certificados
        </a>
      </ui-page-header>

      <div class="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <ui-section-card title="Seleccionar docente" description="Busque primero al docente y cargue automáticamente su estado de cuenta." icon="person_search">
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar docente</span>
              <input
                [value]="teacherSearch()"
                (input)="teacherSearch.set(($any($event.target).value ?? '').trimStart())"
                type="text"
                placeholder="Ej. Pérez o CI"
                class="app-field"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Docente seleccionado</span>
              <select
                [value]="selectedTeacherId() || ''"
                (change)="selectTeacher($any($event.target).value)"
                class="app-field"
              >
                <option value="">Seleccione un docente</option>
                @for (teacher of filteredTeachers(); track teacher.id) {
                  <option [value]="teacher.id">{{ teacherLabel(teacher) }}</option>
                }
              </select>
            </label>
          </div>
        </ui-section-card>

        <ui-section-card title="Acciones rápidas" description="Mantenga las operaciones frecuentes visibles sin convertir la pantalla en un módulo financiero técnico." icon="bolt">
          <div class="mt-4 space-y-3">
            <button
              type="button"
              (click)="openConceptModal()"
              class="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-cyan-300"
            >
              <span class="material-symbols-rounded text-cyan-700">category</span>
              <span>
                <span class="block font-semibold text-slate-950">Nuevo concepto</span>
                <span class="mt-1 block text-sm text-slate-600">Registrar un concepto de obligación para futuras deudas.</span>
              </span>
            </button>

            <button
              type="button"
              (click)="openObligationModal()"
              [disabled]="!selectedTeacherId()"
              class="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition enabled:hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span class="material-symbols-rounded text-cyan-700">request_quote</span>
              <span>
                <span class="block font-semibold text-slate-950">Registrar obligación</span>
                <span class="mt-1 block text-sm text-slate-600">Crea una deuda para el docente actualmente seleccionado.</span>
              </span>
            </button>
          </div>

          <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Conceptos activos</p>
            <div class="mt-4 space-y-3">
              @for (concept of activeConcepts(); track concept.id) {
                <div class="rounded-2xl border border-slate-200 px-4 py-3">
                  <p class="font-semibold text-slate-950">{{ concept.name }}</p>
                  <p class="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{{ concept.code }}</p>
                </div>
              }

              @if (!activeConcepts().length) {
                <ui-inline-alert tone="warning" title="Sin conceptos activos" message="Cree al menos un concepto antes de registrar obligaciones." />
              }
            </div>
          </div>

        </ui-section-card>
      </div>

      @if (statement()) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ui-summary-card label="Total registrado" [value]="formatMoney(statement()!.total_obligated)" icon="request_quote" tone="slate" />
          <ui-summary-card label="Total pagado" [value]="formatMoney(statement()!.total_paid)" icon="payments" tone="emerald" />
          <ui-summary-card label="Saldo pendiente" [value]="formatMoney(statement()!.pending_amount)" icon="account_balance_wallet" tone="rose" />
          <ui-summary-card
            label="Elegibilidad no adeudo"
            [value]="statement()!.eligible_for_no_debt ? 'Apto' : 'No apto'"
            [hint]="statement()!.message"
            icon="verified"
            [tone]="statement()!.eligible_for_no_debt ? 'emerald' : 'amber'"
          />
        </div>

        <ui-section-card
          [title]="'Obligaciones de ' + statement()!.teacher_name"
          description="Revise saldo, vencimiento y pagos sin perder de vista la elegibilidad del certificado de no adeudo."
          icon="fact_check"
        >
          <div class="mb-6">
            <div
              class="rounded-2xl border p-5"
              [class.border-emerald-200]="statement()!.eligible_for_no_debt"
              [class.bg-emerald-50]="statement()!.eligible_for_no_debt"
              [class.border-amber-200]="!statement()!.eligible_for_no_debt"
              [class.bg-amber-50]="!statement()!.eligible_for_no_debt"
            >
              <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Siguiente paso</p>
              <p class="mt-3 text-lg font-bold text-slate-950">
                {{ statement()!.eligible_for_no_debt ? 'Puede continuar en certificados' : 'Debe regularizar saldo pendiente' }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-700">
                {{ statement()!.eligible_for_no_debt ? 'El docente ya puede continuar al flujo documental del certificado.' : 'Registre pagos o actualice obligaciones antes de intentar aprobar un no adeudo.' }}
              </p>
            </div>
          </div>

          <div class="mt-6">
            <ui-table-shell [empty]="!statement()!.obligations.length" emptyMessage="Este docente todavía no tiene obligaciones registradas.">
            <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-left text-slate-500">
                    <th class="px-4 py-3 font-semibold">Concepto</th>
                    <th class="px-4 py-3 font-semibold">Referencia</th>
                    <th class="px-4 py-3 font-semibold">Monto</th>
                    <th class="px-4 py-3 font-semibold">Pagado</th>
                    <th class="px-4 py-3 font-semibold">Saldo</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                    <th class="px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (item of paginatedObligations().items; track item.id) {
                    <tr>
                      <td class="px-4 py-4">
                        <p class="font-semibold text-slate-950">{{ item.concept_name }}</p>
                        @if (item.due_date) {
                          <p class="mt-1 text-xs text-slate-500">Vence: {{ formatDateLabel(item.due_date) }}</p>
                        }
                      </td>
                      <td class="px-4 py-4 text-slate-700">{{ item.reference_label || 'Sin referencia' }}</td>
                      <td class="px-4 py-4 font-semibold text-slate-950">{{ formatMoney(item.total_amount) }}</td>
                      <td class="px-4 py-4 text-emerald-700">{{ formatMoney(item.paid_amount) }}</td>
                      <td class="px-4 py-4 font-semibold" [class.text-rose-700]="item.balance > 0" [class.text-emerald-700]="item.balance <= 0">
                        {{ formatMoney(item.balance) }}
                      </td>
                      <td class="px-4 py-4">
                        <ui-status-badge
                          [label]="obligationStatusLabel(item.status)"
                          [tone]="item.status === 'paid' ? 'emerald' : item.status === 'partial' ? 'amber' : item.status === 'cancelled' ? 'slate' : 'rose'"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <button
                          type="button"
                          (click)="openPaymentModal(item)"
                          [disabled]="item.status === 'paid' || item.status === 'cancelled'"
                          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 enabled:hover:border-cyan-300 enabled:hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span class="material-symbols-rounded text-[16px]">payments</span>
                          Registrar pago
                        </button>
                      </td>
                    </tr>
                  }
              </tbody>
            </table>
          </div>
          <ui-pagination
            [page]="paginatedObligations().page"
            [pages]="paginatedObligations().pages"
            [perPage]="paginatedObligations().perPage"
            [total]="paginatedObligations().total"
            [start]="paginatedObligations().start"
            [end]="paginatedObligations().end"
            (pageChange)="tablePage.set($event)"
            (perPageChange)="updatePerPage($event)"
          />
            </ui-table-shell>
          </div>
        </ui-section-card>
      } @else {
        <ui-empty-state
          icon="account_balance_wallet"
          title="Seleccione un docente para revisar su estado de cuenta"
          description="El sistema mostrará automáticamente obligaciones, pagos, saldo pendiente y si el docente puede respaldar un certificado de no adeudo."
        />
      }

      <ui-slide-over
        [open]="conceptModalOpen()"
        eyebrow="Nuevo concepto"
        title="Registrar concepto de obligación"
        description="Cree conceptos simples y reutilizables para futuras obligaciones."
        (closed)="closeConceptModal()"
      >
        <form [formGroup]="conceptForm" class="grid gap-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Código</span>
            <input formControlName="code" type="text" placeholder="Ej. ordinary_contribution" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Nombre visible</span>
            <input formControlName="name" type="text" placeholder="Ej. Aporte ordinario" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Descripción</span>
            <textarea formControlName="description" rows="3" class="app-field"></textarea>
          </label>
        </form>
        <button drawer-actions type="button" (click)="closeConceptModal()" class="app-button-secondary">Cancelar</button>
        <button drawer-actions type="button" (click)="submitConcept()" class="app-button-primary">Guardar concepto</button>
      </ui-slide-over>

      <ui-slide-over
        [open]="obligationModalOpen()"
        eyebrow="Nueva obligación"
        [title]="selectedTeacherName() || 'Docente seleccionado'"
        description="Registre una deuda simple y visible para el estado de cuenta del docente."
        (closed)="closeObligationModal()"
      >
        <form [formGroup]="obligationForm" class="grid gap-4 lg:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Concepto</span>
            <select formControlName="concept_id" class="app-field">
              <option [ngValue]="null">Seleccione un concepto</option>
              @for (concept of activeConcepts(); track concept.id) {
                <option [ngValue]="concept.id">{{ concept.name }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Monto total</span>
            <input formControlName="total_amount" type="number" min="0.01" step="0.01" class="app-field" />
          </label>

          <label class="block lg:col-span-2">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Referencia</span>
            <input formControlName="reference_label" type="text" placeholder="Ej. Gestión 2026 / abril" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha límite</span>
            <input formControlName="due_date" type="date" class="app-field" />
          </label>

          <label class="block lg:col-span-2">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Observación</span>
            <textarea formControlName="observation" rows="3" class="app-field"></textarea>
          </label>
        </form>
        <button drawer-actions type="button" (click)="closeObligationModal()" class="app-button-secondary">Cancelar</button>
        <button drawer-actions type="button" (click)="submitObligation()" class="app-button-primary">Guardar obligación</button>
      </ui-slide-over>

      <ui-slide-over
        [open]="paymentModalOpen() && !!currentObligation()"
        eyebrow="Registrar pago"
        [title]="currentObligation()?.concept_name || 'Pago'"
        [description]="'Saldo actual: ' + (currentObligation() ? formatMoney(currentObligation()!.balance) : formatMoney(0))"
        (closed)="closePaymentModal()"
      >
        <form [formGroup]="paymentForm" class="grid gap-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Monto pagado</span>
            <input formControlName="amount" type="number" min="0.01" step="0.01" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Fecha de pago</span>
            <input formControlName="payment_date" type="date" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Referencia</span>
            <input formControlName="reference" type="text" placeholder="Ej. Recibo o depósito" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Observación</span>
            <textarea formControlName="observation" rows="3" class="app-field"></textarea>
          </label>
        </form>

        <button drawer-actions type="button" (click)="closePaymentModal()" class="app-button-secondary">Cancelar</button>
        <button drawer-actions type="button" (click)="submitPayment()" class="app-button-primary">Registrar pago</button>
      </ui-slide-over>
    </section>
  `,
})
export class DebtsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teachersApi = inject(TeachersApi);
  private readonly debtsApi = inject(DebtsApi);
  private readonly uiFeedback = inject(UiFeedbackService);

  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly concepts = signal<ObligationConcept[]>([]);
  protected readonly statement = signal<TeacherStatement | null>(null);
  protected readonly selectedTeacherId = signal<number | null>(null);
  protected readonly teacherSearch = signal('');
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly conceptModalOpen = signal(false);
  protected readonly obligationModalOpen = signal(false);
  protected readonly paymentModalOpen = signal(false);
  protected readonly currentObligation = signal<TeacherObligation | null>(null);

  protected readonly filteredTeachers = computed(() => {
    const term = this.teacherSearch().trim().toLowerCase();

    return this.teachers().filter((teacher) => {
      if (!term) {
        return true;
      }

      return [teacher.first_names, teacher.last_names, teacher.ci, teacher.teacher_code]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  });

  protected readonly activeConcepts = computed(() => this.concepts().filter((item) => item.is_active));
  protected readonly paginatedObligations = computed(() =>
    paginateItems(this.statement()?.obligations || [], this.tablePage(), this.perPage()),
  );

  protected readonly conceptForm = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
  });

  protected readonly obligationForm = this.fb.group({
    concept_id: [null as number | null, [Validators.required]],
    reference_label: [''],
    total_amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    due_date: [''],
    observation: [''],
  });

  protected readonly paymentForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    payment_date: ['', [Validators.required]],
    reference: [''],
    observation: [''],
  });

  ngOnInit(): void {
    this.teachersApi.getAll().subscribe({
      next: (response) => this.teachers.set(response.data),
    });
    this.loadConcepts();
  }

  protected selectTeacher(value: string): void {
    const teacherId = value ? Number(value) : null;
    this.selectedTeacherId.set(teacherId);

    if (!teacherId) {
      this.statement.set(null);
      return;
    }

    this.loadStatement(teacherId);
  }

  protected teacherLabel(teacher: Teacher): string {
    return `${formatFullName(teacher.first_names, teacher.last_names)} · CI ${teacher.ci}`;
  }

  protected selectedTeacherName(): string {
    const teacher = this.teachers().find((item) => item.id === this.selectedTeacherId());
    return teacher ? this.teacherLabel(teacher) : '';
  }

  protected openConceptModal(): void {
    this.conceptModalOpen.set(true);
  }

  protected closeConceptModal(): void {
    this.conceptModalOpen.set(false);
    this.conceptForm.reset({
      code: '',
      name: '',
      description: '',
    });
  }

  protected openObligationModal(): void {
    if (!this.selectedTeacherId()) {
      this.uiFeedback.warning('Seleccione un docente', 'Primero elija el docente al que corresponde la obligación.');
      return;
    }

    this.obligationModalOpen.set(true);
  }

  protected closeObligationModal(): void {
    this.obligationModalOpen.set(false);
    this.obligationForm.reset({
      concept_id: null,
      reference_label: '',
      total_amount: null,
      due_date: '',
      observation: '',
    });
  }

  protected openPaymentModal(obligation: TeacherObligation): void {
    this.currentObligation.set(obligation);
    this.paymentModalOpen.set(true);
    this.paymentForm.reset({
      amount: obligation.balance || null,
      payment_date: new Date().toISOString().slice(0, 10),
      reference: '',
      observation: '',
    });
  }

  protected closePaymentModal(): void {
    this.paymentModalOpen.set(false);
    this.currentObligation.set(null);
    this.paymentForm.reset({
      amount: null,
      payment_date: '',
      reference: '',
      observation: '',
    });
  }

  protected submitConcept(): void {
    if (this.conceptForm.invalid) {
      this.conceptForm.markAllAsTouched();
      return;
    }

    const raw = this.conceptForm.getRawValue();

    this.debtsApi.createConcept({
      code: (raw.code || '').trim(),
      name: (raw.name || '').trim(),
      description: raw.description || null,
      is_active: true,
    }).subscribe({
      next: () => {
        this.uiFeedback.success('Concepto registrado', 'El concepto quedó disponible para nuevas obligaciones.');
        this.closeConceptModal();
        this.loadConcepts();
      },
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo registrar el concepto', formatApiError(errorResponse));
      },
    });
  }

  protected submitObligation(): void {
    if (!this.selectedTeacherId()) {
      return;
    }

    if (this.obligationForm.invalid) {
      this.obligationForm.markAllAsTouched();
      return;
    }

    const raw = this.obligationForm.getRawValue();

    this.debtsApi.createObligation({
      teacher_id: this.selectedTeacherId()!,
      concept_id: Number(raw.concept_id),
      reference_label: raw.reference_label || null,
      total_amount: Number(raw.total_amount),
      due_date: raw.due_date || null,
      observation: raw.observation || null,
    }).subscribe({
      next: () => {
        this.uiFeedback.success('Obligación registrada', 'La deuda quedó asociada al docente seleccionado.');
        this.closeObligationModal();
        this.loadStatement(this.selectedTeacherId()!);
      },
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo registrar la obligación', formatApiError(errorResponse));
      },
    });
  }

  protected submitPayment(): void {
    const obligation = this.currentObligation();
    if (!obligation) {
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const raw = this.paymentForm.getRawValue();

    this.debtsApi.addPayment(obligation.id, {
      amount: Number(raw.amount),
      payment_date: raw.payment_date || '',
      reference: raw.reference || null,
      observation: raw.observation || null,
    }).subscribe({
      next: () => {
        this.uiFeedback.success('Pago registrado', 'El estado de cuenta se actualizó correctamente.');
        this.closePaymentModal();
        if (this.selectedTeacherId()) {
          this.loadStatement(this.selectedTeacherId()!);
        }
      },
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo registrar el pago', formatApiError(errorResponse));
      },
    });
  }

  protected obligationStatusLabel(status: TeacherObligation['status']): string {
    return formatObligationStatus(status);
  }

  protected formatDateLabel(value?: string | null): string {
    return formatDate(value);
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value || 0);
  }

  protected updatePerPage(value: number): void {
    this.perPage.set(value);
    this.tablePage.set(1);
  }

  private loadConcepts(): void {
    this.debtsApi.getConcepts().subscribe({
      next: (response) => this.concepts.set(response.data),
    });
  }

  private loadStatement(teacherId: number): void {
    this.debtsApi.getStatement(teacherId).subscribe({
      next: (response) => this.statement.set(response.data),
      error: (errorResponse) => {
        this.uiFeedback.error('No se pudo cargar el estado de cuenta', formatApiError(errorResponse));
        this.statement.set(null);
      },
    });
  }
}
