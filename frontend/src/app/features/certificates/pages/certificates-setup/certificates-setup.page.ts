import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TeachersApi } from '../../../teachers/data-access/teachers.api';
import { CertificatesApi } from '../../data-access/certificates.api';
import { OrganizationalApi } from '../../../organizational/data-access/organizational.api';
import { Teacher } from '../../../../shared/types/teacher.types';
import { SupportingDocument } from '../../../../shared/types/organization.types';
import {
  CertifiableEvent,
  CertificateTemplate,
  CertificateType,
  EventParticipation,
} from '../../../../shared/types/certificate.types';
import {
  eventStatusOptions,
  formatApiError,
  formatDate,
  formatDocumentType,
  formatEventStatus,
  formatFullName,
  formatParticipationStatus,
  participationStatusOptions,
} from '../../../../shared/utils/ui-helpers';

@Component({
  selector: 'app-certificates-setup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div>
        <a routerLink="/certificates" class="text-sm font-semibold text-cyan-700">← Volver a certificados</a>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Configuración del módulo</h1>
        <p class="mt-2 text-sm text-slate-600">Aquí se preparan los datos base para que administración pueda emitir certificados sin fricción.</p>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-slate-950">Tipos de certificado</h2>
          <form [formGroup]="typeForm" (ngSubmit)="createType()" class="mt-4 space-y-3">
            <input formControlName="code" type="text" placeholder="Código" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input formControlName="name" type="text" placeholder="Nombre" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <textarea formControlName="description" rows="2" placeholder="Descripción" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <label class="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" formControlName="requires_event" /> Requiere evento</label>
            <button type="submit" class="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Crear tipo</button>
          </form>

          <div class="mt-5 space-y-2">
            @for (item of types(); track item.id) {
              <div class="rounded-2xl border border-slate-200 px-4 py-3">
                <p class="font-semibold text-slate-950">{{ item.name }}</p>
                <p class="text-sm text-slate-600">{{ item.code }}</p>
              </div>
            }
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-slate-950">Plantillas</h2>
          <form [formGroup]="templateForm" (ngSubmit)="createTemplate()" class="mt-4 space-y-3">
            <select formControlName="certificate_type_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione tipo</option>
              @for (item of types(); track item.id) {
                <option [ngValue]="item.id">{{ item.name }}</option>
              }
            </select>
            <input formControlName="name" type="text" placeholder="Nombre de plantilla" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <textarea formControlName="header_text" rows="2" placeholder="Encabezado" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <textarea formControlName="body_template" rows="4" placeholder="Texto principal del certificado" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <textarea formControlName="footer_text" rows="2" placeholder="Pie de página" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <button type="submit" class="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Crear plantilla</button>
          </form>

          <div class="mt-5 space-y-2">
            @for (item of templates(); track item.id) {
              <div class="rounded-2xl border border-slate-200 px-4 py-3">
                <p class="font-semibold text-slate-950">{{ item.name }}</p>
                <p class="text-sm text-slate-600">{{ typeName(item.certificate_type_id) }}</p>
              </div>
            }
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-slate-950">Eventos certificables</h2>
          <form [formGroup]="eventForm" (ngSubmit)="createEvent()" class="mt-4 space-y-3">
            <input formControlName="name" type="text" placeholder="Nombre del evento" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input formControlName="location" type="text" placeholder="Lugar" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <div class="grid gap-3 sm:grid-cols-2">
              <input formControlName="start_date" type="date" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              <input formControlName="end_date" type="date" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </div>
            <select formControlName="status" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              @for (option of eventStatusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
            <select formControlName="supporting_document_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Documento de respaldo opcional</option>
              @for (item of documents(); track item.id) {
                <option [ngValue]="item.id">{{ documentLabel(item) }}</option>
              }
            </select>
            <textarea formControlName="description" rows="3" placeholder="Descripción" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <button type="submit" class="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Crear evento</button>
          </form>

          <div class="mt-5 space-y-2">
            @for (item of events(); track item.id) {
              <div class="rounded-2xl border border-slate-200 px-4 py-3">
                <p class="font-semibold text-slate-950">{{ item.name }}</p>
                <p class="text-sm text-slate-600">{{ formatDateLabel(item.start_date) }} · {{ eventStatusLabel(item.status) }}</p>
              </div>
            }
          </div>
        </article>

        <article class="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-slate-950">Participaciones</h2>
          <form [formGroup]="participationForm" (ngSubmit)="createParticipation()" class="mt-4 space-y-3">
            <select formControlName="teacher_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione docente</option>
              @for (item of teachers(); track item.id) {
                <option [ngValue]="item.id">{{ teacherName(item) }}</option>
              }
            </select>
            <select formControlName="event_id" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option [ngValue]="null">Seleccione evento</option>
              @for (item of events(); track item.id) {
                <option [ngValue]="item.id">{{ item.name }}</option>
              }
            </select>
            <input formControlName="role_name" type="text" placeholder="Rol en el evento" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <input formControlName="participation_type" type="text" placeholder="Tipo de participación" class="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            <select formControlName="status" class="w-full rounded-2xl border border-slate-300 px-4 py-3">
              @for (option of participationStatusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
            <textarea formControlName="observation" rows="2" placeholder="Observación" class="w-full rounded-2xl border border-slate-300 px-4 py-3"></textarea>
            <button type="submit" class="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Registrar participación</button>
          </form>

          <div class="mt-5 space-y-2">
            @for (item of participations(); track item.id) {
              <div class="rounded-2xl border border-slate-200 px-4 py-3">
                <p class="font-semibold text-slate-950">{{ participationLabel(item) }}</p>
                <p class="text-sm text-slate-600">{{ item.participation_type }} · {{ participationStatusLabel(item.status) }}</p>
              </div>
            }
          </div>
        </article>
      </div>

      @if (message()) {
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ message() }}</div>
      }

      @if (error()) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error() }}</div>
      }
    </section>
  `,
})
export class CertificatesSetupPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly certificatesApi = inject(CertificatesApi);
  private readonly teachersApi = inject(TeachersApi);
  private readonly organizationalApi = inject(OrganizationalApi);

  protected readonly types = signal<CertificateType[]>([]);
  protected readonly templates = signal<CertificateTemplate[]>([]);
  protected readonly events = signal<CertifiableEvent[]>([]);
  protected readonly participations = signal<EventParticipation[]>([]);
  protected readonly teachers = signal<Teacher[]>([]);
  protected readonly documents = signal<SupportingDocument[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly eventStatusOptions = eventStatusOptions;
  protected readonly participationStatusOptions = participationStatusOptions;

  protected readonly typeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
    requires_event: [false],
    is_active: [true],
  });

  protected readonly templateForm = this.fb.group({
    certificate_type_id: [null as number | null, [Validators.required]],
    name: ['', [Validators.required]],
    header_text: [''],
    body_template: ['', [Validators.required]],
    footer_text: [''],
    is_active: [true],
  });

  protected readonly eventForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    location: [''],
    start_date: ['', [Validators.required]],
    end_date: [''],
    status: ['planned', [Validators.required]],
    supporting_document_id: [null as number | null],
  });

  protected readonly participationForm = this.fb.group({
    teacher_id: [null as number | null, [Validators.required]],
    event_id: [null as number | null, [Validators.required]],
    role_name: [''],
    participation_type: ['participant', [Validators.required]],
    status: ['registered', [Validators.required]],
    observation: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
    this.certificatesApi.getTypes().subscribe({ next: (response) => this.types.set(response.data) });
    this.certificatesApi.getTemplates().subscribe({ next: (response) => this.templates.set(response.data) });
    this.certificatesApi.getEvents().subscribe({ next: (response) => this.events.set(response.data) });
    this.certificatesApi.getParticipations().subscribe({ next: (response) => this.participations.set(response.data) });
    this.teachersApi.getAll().subscribe({ next: (response) => this.teachers.set(response.data) });
    this.organizationalApi.getDocuments().subscribe({ next: (response) => this.documents.set(response.data) });
  }

  protected createType(): void {
    this.message.set('');
    this.error.set('');
    this.certificatesApi.createType(this.typeForm.getRawValue()).subscribe({
      next: () => {
        this.message.set('Tipo creado correctamente.');
        this.typeForm.reset({ code: '', name: '', description: '', requires_event: false, is_active: true });
        this.loadAll();
      },
      error: (errorResponse) => this.error.set(formatApiError(errorResponse, 'No se pudo crear el tipo.')),
    });
  }

  protected createTemplate(): void {
    if (this.templateForm.invalid) {
      return;
    }

    const raw = this.templateForm.getRawValue();
    this.message.set('');
    this.error.set('');
    this.certificatesApi.createTemplate({
      certificate_type_id: Number(raw.certificate_type_id),
      name: raw.name || '',
      header_text: raw.header_text || null,
      body_template: raw.body_template || '',
      footer_text: raw.footer_text || null,
      is_active: !!raw.is_active,
    }).subscribe({
      next: () => {
        this.message.set('Plantilla creada correctamente.');
        this.templateForm.reset({ certificate_type_id: null, name: '', header_text: '', body_template: '', footer_text: '', is_active: true });
        this.loadAll();
      },
      error: (errorResponse) => this.error.set(formatApiError(errorResponse, 'No se pudo crear la plantilla.')),
    });
  }

  protected createEvent(): void {
    if (this.eventForm.invalid) {
      return;
    }

    const raw = this.eventForm.getRawValue();
    this.message.set('');
    this.error.set('');
    this.certificatesApi.createEvent({
      name: raw.name || '',
      description: raw.description || null,
      location: raw.location || null,
      start_date: raw.start_date || '',
      end_date: raw.end_date || null,
      status: raw.status || 'planned',
      supporting_document_id: raw.supporting_document_id ? Number(raw.supporting_document_id) : null,
    }).subscribe({
      next: () => {
        this.message.set('Evento creado correctamente.');
        this.eventForm.reset({ name: '', description: '', location: '', start_date: '', end_date: '', status: 'planned', supporting_document_id: null });
        this.loadAll();
      },
      error: (errorResponse) => this.error.set(formatApiError(errorResponse, 'No se pudo crear el evento.')),
    });
  }

  protected createParticipation(): void {
    if (this.participationForm.invalid) {
      return;
    }

    const raw = this.participationForm.getRawValue();
    this.message.set('');
    this.error.set('');
    this.certificatesApi.createParticipation({
      teacher_id: Number(raw.teacher_id),
      event_id: Number(raw.event_id),
      role_name: raw.role_name || null,
      participation_type: raw.participation_type || 'participant',
      status: raw.status || 'registered',
      observation: raw.observation || null,
    }).subscribe({
      next: () => {
        this.message.set('Participación registrada correctamente.');
        this.participationForm.reset({ teacher_id: null, event_id: null, role_name: '', participation_type: 'participant', status: 'registered', observation: '' });
        this.loadAll();
      },
      error: (errorResponse) => this.error.set(formatApiError(errorResponse, 'No se pudo registrar la participación.')),
    });
  }

  protected typeName(id: number): string {
    return this.types().find((item) => item.id === id)?.name || 'Tipo';
  }

  protected teacherName(teacher: Teacher): string {
    return formatFullName(teacher.first_names, teacher.last_names);
  }

  protected eventStatusLabel(value: string): string {
    return formatEventStatus(value);
  }

  protected participationStatusLabel(value: string): string {
    return formatParticipationStatus(value);
  }

  protected documentLabel(item: SupportingDocument): string {
    return `${formatDocumentType(item.document_type)} ${item.document_number || ''}`.trim();
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected participationLabel(item: EventParticipation): string {
    const teacher = this.teachers().find((entry) => entry.id === item.teacher_id);
    const event = this.events().find((entry) => entry.id === item.event_id);
    return `${teacher ? this.teacherName(teacher) : 'Docente'} · ${event?.name || 'Evento'}`;
  }
}
