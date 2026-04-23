import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { UiFeedbackService } from '../services/ui-feedback.service';
import { AuthStorageService } from '../services/auth-storage.service';

interface SessionUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

interface NavItem {
  label: string;
  link: string;
  icon: string;
  description: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-transparent text-slate-900">
      <div class="mx-auto flex min-h-screen max-w-[1600px]">
        <aside class="hidden w-[320px] shrink-0 border-r border-slate-200/70 bg-slate-950 text-white lg:flex lg:flex-col">
          <div class="border-b border-white/10 px-6 py-6">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                <span class="material-symbols-rounded text-[26px]">apartment</span>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">FEDSIDUMSA</p>
                <h1 class="mt-1 text-lg font-bold text-white">Sistema administrativo</h1>
              </div>
            </div>

            <div class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Usuario actual</p>
              <p class="mt-2 text-sm font-semibold text-white">{{ user()?.full_name || 'Sin sesión' }}</p>
              <p class="mt-1 text-sm text-slate-300">{{ user()?.role || 'Sin rol' }}</p>
            </div>
          </div>

          <nav class="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            @for (section of sections; track section.title) {
              <section>
                <p class="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {{ section.title }}
                </p>
                <div class="mt-3 space-y-1.5">
                  @for (item of section.items; track item.link) {
                    <a
                      [routerLink]="item.link"
                      routerLinkActive="bg-white text-slate-950 shadow-sm"
                      [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' || item.link === '/teachers' || item.link === '/certificates' }"
                      class="group flex items-start gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/8 hover:text-white"
                      (click)="closeMobileMenu()"
                    >
                      <span class="material-symbols-rounded mt-0.5 text-[20px]">{{ item.icon }}</span>
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold">{{ item.label }}</span>
                        <span class="mt-1 block text-xs leading-5 text-slate-400 group-hover:text-slate-300">
                          {{ item.description }}
                        </span>
                      </span>
                    </a>
                  }
                </div>
              </section>
            }
          </nav>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
          <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur">
            <div class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div class="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                  (click)="toggleMobileMenu()"
                  aria-label="Abrir menú"
                >
                  <span class="material-symbols-rounded">menu</span>
                </button>

                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Plataforma interna</p>
                  <h2 class="truncate text-lg font-bold text-slate-950 sm:text-xl">Gestión administrativa FEDSIDUMSA UMSA</h2>
                </div>
              </div>

              <div class="hidden items-center gap-3 sm:flex">
                <a
                  routerLink="/teachers"
                  class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  <span class="material-symbols-rounded text-[18px]">groups</span>
                  Docentes
                </a>
                <a
                  routerLink="/certificates"
                  class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  <span class="material-symbols-rounded text-[18px]">workspace_premium</span>
                  Certificados
                </a>
                <a
                  routerLink="/organizational/appointments"
                  class="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <span class="material-symbols-rounded text-[18px]">assignment_ind</span>
                  Designaciones
                </a>
                <button
                  type="button"
                  (click)="logout()"
                  class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <span class="material-symbols-rounded text-[18px]">logout</span>
                  Salir
                </button>
              </div>
            </div>
          </header>

          @if (mobileMenuOpen()) {
            <div class="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" (click)="closeMobileMenu()"></div>
          }

          <div
            class="fixed inset-y-0 left-0 z-50 w-[310px] max-w-[88vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 lg:hidden"
            [class.-translate-x-full]="!mobileMenuOpen()"
            [class.translate-x-0]="mobileMenuOpen()"
          >
            <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Menú</p>
                <h3 class="mt-1 text-lg font-bold text-slate-950">Navegación</h3>
              </div>
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700"
                (click)="closeMobileMenu()"
                aria-label="Cerrar menú"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <nav class="space-y-6 overflow-y-auto px-4 py-5">
              @for (section of sections; track section.title) {
                <section>
                  <p class="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {{ section.title }}
                  </p>
                  <div class="mt-3 space-y-1.5">
                    @for (item of section.items; track item.link) {
                      <a
                        [routerLink]="item.link"
                        routerLinkActive="bg-slate-950 text-white"
                        [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' || item.link === '/teachers' || item.link === '/certificates' }"
                        class="flex items-start gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100"
                        (click)="closeMobileMenu()"
                      >
                        <span class="material-symbols-rounded mt-0.5 text-[20px]">{{ item.icon }}</span>
                        <span class="min-w-0">
                          <span class="block text-sm font-semibold">{{ item.label }}</span>
                          <span class="mt-1 block text-xs leading-5 text-slate-500">{{ item.description }}</span>
                        </span>
                      </a>
                    }
                  </div>
                </section>
              }

              <button
                type="button"
                (click)="logout()"
                class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                <span class="material-symbols-rounded text-[18px]">logout</span>
                Cerrar sesión
              </button>
            </nav>
          </div>

          <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <router-outlet />
          </main>
        </div>
      </div>

      <div class="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
        @for (toast of uiFeedback.toasts(); track toast.id) {
          <div class="pointer-events-auto rounded-2xl border bg-white p-4 shadow-xl"
            [class.border-emerald-200]="toast.tone === 'success'"
            [class.border-rose-200]="toast.tone === 'error'"
            [class.border-amber-200]="toast.tone === 'warning'"
            [class.border-cyan-200]="toast.tone === 'info'"
          >
            <div class="flex items-start gap-3">
              <span class="material-symbols-rounded mt-0.5"
                [class.text-emerald-700]="toast.tone === 'success'"
                [class.text-rose-700]="toast.tone === 'error'"
                [class.text-amber-700]="toast.tone === 'warning'"
                [class.text-cyan-700]="toast.tone === 'info'"
              >
                {{ toastIcon(toast.tone) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-slate-950">{{ toast.title }}</p>
                @if (toast.message) {
                  <p class="mt-1 text-sm leading-6 text-slate-600">{{ toast.message }}</p>
                }
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                (click)="uiFeedback.removeToast(toast.id)"
              >
                <span class="material-symbols-rounded text-[18px]">close</span>
              </button>
            </div>
          </div>
        }
      </div>

      @if (uiFeedback.confirmState(); as confirmState) {
        <div class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4">
          <div class="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div class="flex items-start gap-3">
              <span class="material-symbols-rounded rounded-2xl p-3"
                [class.bg-slate-100]="confirmState.tone === 'default' || !confirmState.tone"
                [class.bg-rose-100]="confirmState.tone === 'danger'"
                [class.bg-emerald-100]="confirmState.tone === 'success'"
                [class.bg-amber-100]="confirmState.tone === 'warning'"
                [class.text-slate-700]="confirmState.tone === 'default' || !confirmState.tone"
                [class.text-rose-700]="confirmState.tone === 'danger'"
                [class.text-emerald-700]="confirmState.tone === 'success'"
                [class.text-amber-700]="confirmState.tone === 'warning'"
              >
                {{ confirmIcon(confirmState.tone || 'default') }}
              </span>
              <div class="min-w-0 flex-1">
                <h3 class="text-xl font-bold text-slate-950">{{ confirmState.title }}</h3>
                <p class="mt-2 text-sm leading-7 text-slate-600">{{ confirmState.message }}</p>
              </div>
            </div>

            @if (confirmState.reasonLabel) {
              <div class="mt-5">
                <label class="mb-2 block text-sm font-semibold text-slate-700">{{ confirmState.reasonLabel }}</label>
                <textarea
                  [(ngModel)]="confirmReason"
                  rows="3"
                  [placeholder]="confirmState.reasonPlaceholder || ''"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3"
                ></textarea>
              </div>
            }

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
                (click)="closeConfirm(false)"
              >
                {{ confirmState.cancelLabel || 'Cancelar' }}
              </button>
              <button
                type="button"
                class="rounded-2xl px-4 py-3 font-semibold text-white"
                [class.bg-slate-950]="confirmState.tone === 'default' || !confirmState.tone"
                [class.bg-rose-700]="confirmState.tone === 'danger'"
                [class.bg-emerald-700]="confirmState.tone === 'success'"
                [class.bg-amber-600]="confirmState.tone === 'warning'"
                (click)="closeConfirm(true)"
              >
                {{ confirmState.confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AppShellComponent {
  private readonly authStorage = inject(AuthStorageService);
  private readonly router = inject(Router);

  protected readonly uiFeedback = inject(UiFeedbackService);
  protected readonly mobileMenuOpen = signal(false);
  protected confirmReason = '';
  protected readonly sections: NavSection[] = [
    {
      title: 'Operación diaria',
      items: [
        {
          label: 'Inicio',
          link: '/dashboard',
          icon: 'space_dashboard',
          description: 'Resumen del sistema y accesos rápidos',
        },
        {
          label: 'Docentes',
          link: '/teachers',
          icon: 'groups',
          description: 'Buscar, registrar y revisar docentes',
        },
        {
          label: 'Designaciones',
          link: '/organizational/appointments',
          icon: 'assignment_ind',
          description: 'Asignación de docentes a cargos',
        },
        {
          label: 'Certificados',
          link: '/certificates',
          icon: 'workspace_premium',
          description: 'Solicitudes, revisión y emisión institucional',
        },
      ],
    },
    {
      title: 'Configuración organizacional',
      items: [
        {
          label: 'Periodos',
          link: '/organizational/periods',
          icon: 'calendar_month',
          description: 'Gestión de periodos administrativos',
        },
        {
          label: 'Instancias',
          link: '/organizational/instances',
          icon: 'account_tree',
          description: 'Estructura organizacional vigente',
        },
        {
          label: 'Grupos de cargo',
          link: '/organizational/position-groups',
          icon: 'category',
          description: 'Clasificación base de cargos',
        },
        {
          label: 'Cargos',
          link: '/organizational/positions',
          icon: 'badge',
          description: 'Cargos disponibles por instancia',
        },
        {
          label: 'Documentos',
          link: '/organizational/documents',
          icon: 'folder_managed',
          description: 'Respaldo documental para designaciones',
        },
        {
          label: 'Reglas de incompatibilidad',
          link: '/organizational/incompatibility-rules',
          icon: 'rule',
          description: 'Restricciones entre grupos de cargo',
        },
      ],
    },
  ];

  protected user(): SessionUser | null {
    return this.authStorage.getUser<SessionUser>();
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.authStorage.clearSession();
    this.router.navigate(['/login']);
  }

  protected toastIcon(tone: string): string {
    if (tone === 'success') {
      return 'check_circle';
    }
    if (tone === 'error') {
      return 'error';
    }
    if (tone === 'warning') {
      return 'warning';
    }
    return 'info';
  }

  protected confirmIcon(tone: string): string {
    if (tone === 'danger') {
      return 'warning';
    }
    if (tone === 'success') {
      return 'task_alt';
    }
    if (tone === 'warning') {
      return 'info';
    }
    return 'help';
  }

  protected closeConfirm(confirmed: boolean): void {
    const current = this.uiFeedback.confirmState();
    const reason = this.confirmReason.trim();

    if (confirmed && current?.reasonRequired && !reason) {
      return;
    }

    this.uiFeedback.resolveConfirm({
      confirmed,
      reason: confirmed ? reason : '',
    });
    this.confirmReason = '';
  }
}
