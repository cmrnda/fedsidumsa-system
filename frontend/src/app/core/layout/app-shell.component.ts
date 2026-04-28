import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

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
  roles?: string[];
}

interface NavSection {
  title: string;
  icon: string;
  items: NavItem[];
}

interface RouteContext {
  section: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-transparent text-slate-900">
      <div class="mx-auto flex min-h-screen max-w-[1680px]">
        <aside
          class="sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-slate-950 text-white transition-[width] duration-200 lg:flex lg:flex-col"
          [ngClass]="sidebarCollapsed() ? 'w-[88px]' : 'w-[288px]'"
        >
          <div class="border-b border-white/10 px-3 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                <span class="material-symbols-rounded text-[23px]">apartment</span>
              </div>
              @if (!sidebarCollapsed()) {
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">FEDSIDUMSA</p>
                  <h1 class="mt-1 truncate text-base font-bold text-white">Administración</h1>
                </div>
              }
              <button
                type="button"
                class="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                (click)="toggleSidebar()"
                [attr.aria-label]="sidebarCollapsed() ? 'Expandir menú' : 'Contraer menú'"
              >
                <span class="material-symbols-rounded text-[18px]">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
              </button>
            </div>

            @if (!sidebarCollapsed()) {
              <div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Usuario actual</p>
                <p class="mt-2 truncate text-sm font-semibold text-white">{{ user()?.full_name || 'Sin sesión' }}</p>
                <p class="mt-1 truncate text-sm text-slate-300">{{ user()?.role || 'Sin rol' }}</p>
              </div>
            }
          </div>

          <nav class="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
            @for (section of sections; track section.title) {
              <section>
                <button
                  type="button"
                  class="flex w-full items-center rounded-xl px-3 py-2 text-left transition hover:bg-white/6"
                  [class.justify-center]="sidebarCollapsed()"
                  [class.justify-between]="!sidebarCollapsed()"
                  (click)="toggleSection(section.title)"
                  [attr.title]="sidebarCollapsed() ? section.title : null"
                >
                  <span class="flex items-center gap-3">
                    <span class="material-symbols-rounded text-cyan-300">{{ section.icon }}</span>
                    @if (!sidebarCollapsed()) {
                      <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ section.title }}</span>
                    }
                  </span>
                  @if (!sidebarCollapsed()) {
                    <span class="material-symbols-rounded text-slate-500 transition" [class.rotate-180]="isSectionOpen(section.title)">expand_more</span>
                  }
                </button>

                @if (isSectionOpen(section.title)) {
                  <div class="mt-3 space-y-1.5">
                    @for (item of section.items; track item.link) {
                      <a
                        *ngIf="canAccess(item)"
                        [routerLink]="item.link"
                        routerLinkActive="bg-white text-slate-950 shadow-sm"
                        [routerLinkActiveOptions]="{ exact: isExactLink(item.link) }"
                        class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-white/8 hover:text-white"
                        [class.justify-center]="sidebarCollapsed()"
                        (click)="closeMobileMenu()"
                        [attr.title]="sidebarCollapsed() ? item.label : null"
                      >
                        <span class="material-symbols-rounded text-[20px]">{{ item.icon }}</span>
                        @if (!sidebarCollapsed()) {
                          <span class="min-w-0 truncate text-sm font-semibold">{{ item.label }}</span>
                        }
                      </a>
                    }
                  </div>
                }
              </section>
            }
          </nav>

          <div class="border-t border-white/10 px-3 py-3">
            <a
              routerLink="/certificates/public"
              class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-slate-200 transition hover:bg-white/8"
              [class.justify-center]="sidebarCollapsed()"
              [attr.title]="sidebarCollapsed() ? 'Área pública' : null"
            >
              <span class="material-symbols-rounded text-cyan-300">public</span>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-semibold text-white">Área pública</span>
              }
            </a>
          </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
          <header class="sticky top-0 z-30 border-b border-white/70 bg-white/78 backdrop-blur-xl">
            <div class="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div class="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                  (click)="toggleMobileMenu()"
                  aria-label="Abrir menú"
                >
                  <span class="material-symbols-rounded">menu</span>
                </button>

                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      {{ routeContext().section }}
                    </span>
                  </div>
                  <h2 class="mt-1.5 truncate text-lg font-bold text-slate-950 sm:text-xl">{{ routeContext().title }}</h2>
                  <p class="hidden truncate text-sm text-slate-500 xl:block">{{ routeContext().description }}</p>
                </div>
              </div>

              <div class="hidden items-center gap-3 lg:flex">
                <div class="max-w-[220px] text-right">
                  <p class="truncate text-sm font-semibold text-slate-950">{{ user()?.full_name || 'Sin sesión' }}</p>
                  <p class="truncate text-xs text-slate-500">{{ user()?.role || 'Sin rol' }}</p>
                </div>
                <button
                  type="button"
                  (click)="logout()"
                  class="app-icon-button border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                  aria-label="Cerrar sesión"
                >
                  <span class="material-symbols-rounded text-[18px]">logout</span>
                </button>
              </div>
            </div>
          </header>

          @if (mobileMenuOpen()) {
            <div class="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" (click)="closeMobileMenu()"></div>
          }

          <div
            class="fixed inset-y-0 left-0 z-50 w-[290px] max-w-[88vw] border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden"
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
                class="app-icon-button"
                (click)="closeMobileMenu()"
                aria-label="Cerrar menú"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <nav class="space-y-6 overflow-y-auto px-4 py-5">
              @for (section of sections; track section.title) {
                <section>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                    (click)="toggleSection(section.title)"
                  >
                    <span class="flex items-center gap-3">
                      <span class="material-symbols-rounded text-cyan-700">{{ section.icon }}</span>
                      <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ section.title }}</span>
                    </span>
                    <span class="material-symbols-rounded text-slate-500 transition" [class.rotate-180]="isSectionOpen(section.title)">expand_more</span>
                  </button>

                  @if (isSectionOpen(section.title)) {
                    <div class="mt-3 space-y-1.5">
                      @for (item of section.items; track item.link) {
                        <a
                          *ngIf="canAccess(item)"
                          [routerLink]="item.link"
                          routerLinkActive="bg-slate-950 text-white"
                          [routerLinkActiveOptions]="{ exact: isExactLink(item.link) }"
                          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-100"
                          (click)="closeMobileMenu()"
                        >
                          <span class="material-symbols-rounded text-[20px]">{{ item.icon }}</span>
                          <span class="min-w-0 truncate text-sm font-semibold">{{ item.label }}</span>
                        </a>
                      }
                    </div>
                  }
                </section>
              }

              <button
                type="button"
                (click)="logout()"
                class="app-button-danger w-full"
              >
                <span class="material-symbols-rounded text-[18px]">logout</span>
                Cerrar sesión
              </button>
            </nav>
          </div>

          <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div class="mx-auto w-full max-w-[1360px]">
              <router-outlet />
            </div>
          </main>
        </div>
      </div>

      @if (uiFeedback.confirmState(); as confirmState) {
        <div class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4">
          <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div class="flex items-start gap-3">
              <span class="material-symbols-rounded rounded-xl p-2.5"
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
                <h3 class="text-lg font-bold text-slate-950">{{ confirmState.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">{{ confirmState.message }}</p>
              </div>
            </div>

            @if (confirmState.reasonLabel) {
              <div class="mt-5">
                <label class="mb-2 block text-sm font-semibold text-slate-700">{{ confirmState.reasonLabel }}</label>
                <textarea
                  [(ngModel)]="confirmReason"
                  rows="3"
                  [placeholder]="confirmState.reasonPlaceholder || ''"
                  class="app-field"
                ></textarea>
              </div>
            }

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="app-button-secondary"
                (click)="closeConfirm(false)"
              >
                {{ confirmState.cancelLabel || 'Cancelar' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white"
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
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly uiFeedback = inject(UiFeedbackService);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly routeContext = signal<RouteContext>({
    section: 'Operación diaria',
    title: 'Inicio operativo',
    description: 'Pendientes, revisión y seguimiento de la jornada.',
  });
  protected confirmReason = '';
  protected readonly sections: NavSection[] = [
    {
      title: 'Operación diaria',
      icon: 'dashboard_customize',
      items: [
        {
          label: 'Inicio operativo',
          link: '/dashboard',
          icon: 'space_dashboard',
          description: 'Pendientes, revisión y accesos principales',
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
        {
          label: 'Validación financiera',
          link: '/debts',
          icon: 'account_balance_wallet',
          description: 'Estado de cuenta y elegibilidad para certificados de no adeudo',
        },
      ],
    },
    {
      title: 'Configuración organizacional',
      icon: 'lan',
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
    {
      title: 'Configuración del sistema',
      icon: 'settings',
      items: [
        {
          label: 'Usuarios',
          link: '/settings/users',
          icon: 'manage_accounts',
          description: 'Cuentas, roles y accesos',
          roles: ['admin'],
        },
      ],
    },
  ];
  protected readonly openSections = signal<Record<string, boolean>>({
    'Operación diaria': true,
    'Configuración organizacional': false,
  });

  ngOnInit(): void {
    this.syncRouteContext();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.syncRouteContext();
        this.closeMobileMenu();
      });
  }

  protected user(): SessionUser | null {
    return this.authStorage.getUser<SessionUser>();
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected toggleSection(title: string): void {
    this.openSections.update((current) => ({
      ...current,
      [title]: !current[title],
    }));
  }

  protected isSectionOpen(title: string): boolean {
    return !!this.openSections()[title];
  }

  protected isExactLink(link: string): boolean {
    return link === '/dashboard' || link === '/teachers' || link === '/certificates' || link === '/debts' || link === '/settings/users';
  }

  protected canAccess(item: NavItem): boolean {
    if (!item.roles?.length) {
      return true;
    }

    const role = this.user()?.role;
    return !!role && item.roles.includes(role);
  }

  protected logout(): void {
    this.authStorage.clearSession();
    this.router.navigate(['/login']);
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

  private syncRouteContext(): void {
    let current = this.activatedRoute.firstChild;

    while (current?.firstChild) {
      current = current.firstChild;
    }

    const data = current?.snapshot.data as Partial<RouteContext> | undefined;

    this.routeContext.set({
      section: data?.section || 'Operación diaria',
      title: data?.title || 'Gestión administrativa FEDSIDUMSA UMSA',
      description: data?.description || 'Flujo institucional y operativo del sistema.',
    });
  }
}
