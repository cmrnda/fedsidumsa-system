import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SystemRole, SystemUser } from '../../../../shared/types/user.types';
import { formatApiError, formatDate, formatSystemRole, paginateItems } from '../../../../shared/utils/ui-helpers';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination.component';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { SlideOverComponent } from '../../../../shared/ui/slide-over.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/ui/summary-card.component';
import { TableShellComponent } from '../../../../shared/ui/table-shell.component';
import { ToolbarComponent } from '../../../../shared/ui/toolbar.component';
import { UsersApi } from '../../data-access/users.api';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InlineAlertComponent,
    PageHeaderComponent,
    PaginationComponent,
    SectionCardComponent,
    SlideOverComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    TableShellComponent,
    ToolbarComponent,
  ],
  template: `
    <section class="space-y-6">
      <ui-page-header
        eyebrow="Configuración del sistema"
        title="Usuarios del sistema"
        description="Administre cuentas, roles y estado de acceso sin exponer datos técnicos al personal administrativo."
      >
        <button header-actions type="button" class="app-button-primary" (click)="openCreateDrawer()">
          <span class="material-symbols-rounded text-[18px]">person_add</span>
          Nuevo usuario
        </button>
      </ui-page-header>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ui-summary-card label="Usuarios" [value]="users().length" icon="manage_accounts" tone="slate" />
        <ui-summary-card label="Activos" [value]="activeCount()" icon="verified_user" tone="emerald" />
        <ui-summary-card label="Inactivos" [value]="inactiveCount()" icon="person_off" tone="amber" />
        <ui-summary-card label="Administradores" [value]="adminCount()" icon="admin_panel_settings" tone="cyan" />
      </div>

      <ui-section-card title="Listado de usuarios" description="Busque por nombre, usuario o correo. Use editar solo cuando necesite cambiar rol, estado o datos básicos." icon="group">
        <ui-toolbar>
          <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="flex flex-col gap-3 md:flex-row md:flex-wrap">
              <label class="block min-w-[240px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Buscar</span>
                <input
                  [value]="searchTerm()"
                  (input)="searchTerm.set(($any($event.target).value ?? '').trimStart())"
                  type="text"
                  placeholder="Ej. admin o María"
                  class="app-field"
                />
              </label>

              <label class="block min-w-[220px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Rol</span>
                <select [value]="roleFilter()" (change)="roleFilter.set($any($event.target).value)" class="app-field">
                  <option value="">Todos</option>
                  @for (role of roles(); track role.id) {
                    <option [value]="role.id">{{ roleLabel(role.name) }}</option>
                  }
                </select>
              </label>

              <label class="block min-w-[180px]">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Estado</span>
                <select [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)" class="app-field">
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </label>

              <button type="button" class="app-button-secondary" (click)="loadAll()">
                <span class="material-symbols-rounded text-[18px]">refresh</span>
                Actualizar
              </button>
            </div>
          </div>
        </ui-toolbar>

        <div class="mt-5">
          <ui-table-shell [empty]="!filteredUsers().length" emptyMessage="No se encontraron usuarios con los filtros actuales.">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr class="text-left text-slate-500">
                  <th class="px-4 py-3 font-semibold">Usuario</th>
                  <th class="px-4 py-3 font-semibold">Correo</th>
                  <th class="px-4 py-3 font-semibold">Rol</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold">Creado</th>
                  <th class="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (user of paginatedUsers().items; track user.id) {
                  <tr class="align-top">
                    <td class="px-4 py-4">
                      <p class="font-semibold text-slate-950">{{ user.full_name }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ user.username }}</p>
                    </td>
                    <td class="px-4 py-4 text-slate-700">{{ user.email || 'Sin correo' }}</td>
                    <td class="px-4 py-4 text-slate-700">{{ roleLabel(user.role_name) }}</td>
                    <td class="px-4 py-4">
                      <ui-status-badge
                        [label]="user.is_active ? 'Activo' : 'Inactivo'"
                        [tone]="user.is_active ? 'emerald' : 'amber'"
                      />
                    </td>
                    <td class="px-4 py-4 text-slate-700">{{ formatDateLabel(user.created_at.slice(0, 10)) }}</td>
                    <td class="px-4 py-4">
                      <div class="flex flex-wrap gap-2">
                        <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-900" (click)="openEditDrawer(user)">
                          <span class="material-symbols-rounded text-[16px]">edit</span>
                          Editar
                        </button>
                        <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-900" (click)="openPasswordDrawer(user)">
                          <span class="material-symbols-rounded text-[16px]">key</span>
                          Contraseña
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <ui-pagination
              [page]="paginatedUsers().page"
              [pages]="paginatedUsers().pages"
              [perPage]="paginatedUsers().perPage"
              [total]="paginatedUsers().total"
              [start]="paginatedUsers().start"
              [end]="paginatedUsers().end"
              (pageChange)="tablePage.set($event)"
              (perPageChange)="updatePerPage($event)"
            />
          </ui-table-shell>
        </div>
      </ui-section-card>

      <ui-slide-over
        [open]="userDrawerOpen()"
        [eyebrow]="editingUser() ? 'Editar usuario' : 'Nuevo usuario'"
        [title]="editingUser() ? editingUser()!.full_name : 'Registrar usuario'"
        description="Defina los datos de acceso y el rol operativo de la cuenta."
        (closed)="closeUserDrawer()"
      >
        <form [formGroup]="userForm" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Usuario</span>
              <input formControlName="username" type="text" class="app-field" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Rol</span>
              <select formControlName="role_id" class="app-field">
                <option [ngValue]="null">Seleccione un rol</option>
                @for (role of roles(); track role.id) {
                  <option [ngValue]="role.id">{{ roleLabel(role.name) }}</option>
                }
              </select>
            </label>
          </div>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Nombre completo</span>
            <input formControlName="full_name" type="text" class="app-field" />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
            <input formControlName="email" type="email" class="app-field" />
          </label>

          @if (!editingUser()) {
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Contraseña inicial</span>
              <input formControlName="password" type="password" class="app-field" />
            </label>
          }

          <label class="app-muted-surface flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">
            <input formControlName="is_active" type="checkbox" />
            Cuenta activa
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo guardar" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Operación completada" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" class="app-button-secondary" (click)="closeUserDrawer()">Cancelar</button>
          <button type="button" class="app-button-primary disabled:cursor-not-allowed disabled:opacity-60" [disabled]="userForm.invalid || loading()" (click)="submitUser()">
            {{ loading() ? 'Guardando...' : editingUser() ? 'Guardar cambios' : 'Crear usuario' }}
          </button>
        </div>
      </ui-slide-over>

      <ui-slide-over
        [open]="passwordDrawerOpen()"
        eyebrow="Cambiar contraseña"
        [title]="passwordUser()?.full_name || 'Usuario'"
        description="Use una contraseña temporal segura y comuníquela por un canal interno."
        (closed)="closePasswordDrawer()"
      >
        <form [formGroup]="passwordForm" class="space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Nueva contraseña</span>
            <input formControlName="password" type="password" class="app-field" />
          </label>

          @if (error()) {
            <ui-inline-alert title="No se pudo actualizar" [message]="error()" tone="danger" icon="error" />
          }

          @if (success()) {
            <ui-inline-alert title="Contraseña actualizada" [message]="success()" tone="success" icon="task_alt" />
          }
        </form>

        <div drawer-actions class="flex gap-3">
          <button type="button" class="app-button-secondary" (click)="closePasswordDrawer()">Cancelar</button>
          <button type="button" class="app-button-primary disabled:cursor-not-allowed disabled:opacity-60" [disabled]="passwordForm.invalid || loading()" (click)="submitPassword()">
            {{ loading() ? 'Guardando...' : 'Actualizar contraseña' }}
          </button>
        </div>
      </ui-slide-over>
    </section>
  `,
})
export class UsersPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApi);

  protected readonly users = signal<SystemUser[]>([]);
  protected readonly roles = signal<SystemRole[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly roleFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly tablePage = signal(1);
  protected readonly perPage = signal(10);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly userDrawerOpen = signal(false);
  protected readonly passwordDrawerOpen = signal(false);
  protected readonly editingUser = signal<SystemUser | null>(null);
  protected readonly passwordUser = signal<SystemUser | null>(null);
  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const roleId = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const matchesRole = !roleId || user.role_id === Number(roleId);
      const matchesStatus = status === '' || user.is_active === (status === 'true');
      const searchable = [user.full_name, user.username, user.email, user.role_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesRole && matchesStatus && (!term || searchable.includes(term));
    });
  });
  protected readonly paginatedUsers = computed(() =>
    paginateItems(this.filteredUsers(), this.tablePage(), this.perPage()),
  );

  protected readonly userForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    email: [''],
    role_id: [null as number | null, [Validators.required]],
    password: ['', [Validators.minLength(8)]],
    is_active: [true],
  });

  protected readonly passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
    this.usersApi.getUsers().subscribe({
      next: (response) => this.users.set(response.data),
    });
    this.usersApi.getRoles().subscribe({
      next: (response) => this.roles.set(response.data),
    });
  }

  protected openCreateDrawer(): void {
    this.editingUser.set(null);
    this.userForm.reset({
      username: '',
      full_name: '',
      email: '',
      role_id: null,
      password: '',
      is_active: true,
    });
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.resetMessages();
    this.userDrawerOpen.set(true);
  }

  protected openEditDrawer(user: SystemUser): void {
    this.editingUser.set(user);
    this.userForm.reset({
      username: user.username,
      full_name: user.full_name,
      email: user.email || '',
      role_id: user.role_id,
      password: '',
      is_active: user.is_active,
    });
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.resetMessages();
    this.userDrawerOpen.set(true);
  }

  protected closeUserDrawer(): void {
    this.userDrawerOpen.set(false);
    this.editingUser.set(null);
    this.resetMessages();
  }

  protected openPasswordDrawer(user: SystemUser): void {
    this.passwordUser.set(user);
    this.passwordForm.reset({ password: '' });
    this.resetMessages();
    this.passwordDrawerOpen.set(true);
  }

  protected closePasswordDrawer(): void {
    this.passwordDrawerOpen.set(false);
    this.passwordUser.set(null);
    this.resetMessages();
  }

  protected submitUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();
    const payload = {
      username: raw.username || '',
      full_name: raw.full_name || '',
      email: raw.email || null,
      role_id: Number(raw.role_id),
      is_active: !!raw.is_active,
    };

    this.loading.set(true);
    this.resetMessages();

    const request = this.editingUser()
      ? this.usersApi.updateUser(this.editingUser()!.id, payload)
      : this.usersApi.createUser({ ...payload, password: raw.password || '' });

    request.subscribe({
      next: () => {
        this.success.set(this.editingUser() ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        this.loadAll();
        this.userDrawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo guardar el usuario.'));
        this.loading.set(false);
      },
    });
  }

  protected submitPassword(): void {
    if (this.passwordForm.invalid || !this.passwordUser()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.resetMessages();

    const raw = this.passwordForm.getRawValue();
    this.usersApi.changePassword(this.passwordUser()!.id, { password: raw.password || '' }).subscribe({
      next: () => {
        this.success.set('Contraseña actualizada correctamente.');
        this.passwordDrawerOpen.set(false);
        this.loading.set(false);
      },
      error: (errorResponse) => {
        this.error.set(formatApiError(errorResponse, 'No se pudo actualizar la contraseña.'));
        this.loading.set(false);
      },
    });
  }

  protected updatePerPage(value: number): void {
    this.perPage.set(value);
    this.tablePage.set(1);
  }

  protected roleLabel(role: string): string {
    return formatSystemRole(role);
  }

  protected formatDateLabel(value: string): string {
    return formatDate(value);
  }

  protected activeCount(): number {
    return this.users().filter((user) => user.is_active).length;
  }

  protected inactiveCount(): number {
    return this.users().filter((user) => !user.is_active).length;
  }

  protected adminCount(): number {
    return this.users().filter((user) => user.role_name === 'admin').length;
  }

  protected resetMessages(): void {
    this.error.set('');
    this.success.set('');
  }
}
