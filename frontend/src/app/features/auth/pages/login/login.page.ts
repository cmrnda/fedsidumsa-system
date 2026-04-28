import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStorageService } from '../../../../core/services/auth-storage.service';
import { InlineAlertComponent } from '../../../../shared/ui/inline-alert.component';
import { AuthApi } from '../../data-access/auth.api';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, InlineAlertComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <div class="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/8 lg:grid-cols-[0.95fr,1.05fr]">
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white sm:p-10">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">FEDSIDUMSA UMSA</p>
          <h1 class="mt-4 text-3xl font-extrabold tracking-tight">Sistema administrativo interno</h1>
          <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200">
            Acceso privado para gestionar docentes, designaciones, certificados y validación financiera desde una sola plataforma.
          </p>

          <div class="mt-8 grid gap-3">
            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
              <span class="material-symbols-rounded text-cyan-200">shield_lock</span>
              <span class="text-sm text-slate-200">Sesión protegida para personal administrativo autorizado.</span>
            </div>
            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
              <span class="material-symbols-rounded text-cyan-200">route</span>
              <span class="text-sm text-slate-200">Inicio operativo, certificados, docentes y organización en un flujo único.</span>
            </div>
          </div>
        </div>

        <div class="bg-white p-8 sm:p-10">
          <div class="mb-6">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Ingreso administrativo</p>
            <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Iniciar sesión</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Use sus credenciales para continuar.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="app-panel space-y-5 p-5">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Usuario</span>
              <input
                formControlName="username"
                class="app-field"
                type="text"
                placeholder="Ingrese su usuario"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
              <input
                formControlName="password"
                class="app-field"
                type="password"
                placeholder="Ingrese su contraseña"
              />
            </label>

            @if (error()) {
              <ui-inline-alert title="No se pudo iniciar sesión" [message]="error()" tone="danger" icon="error" />
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="material-symbols-rounded text-[18px]">{{ loading() ? 'progress_activity' : 'login' }}</span>
              {{ loading() ? 'Ingresando...' : 'Ingresar al sistema' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly authStorage = inject(AuthStorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authStorage.setSession(response.access_token, response.user);
        this.router.navigateByUrl(this.safeReturnUrl());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Credenciales inválidas');
        this.loading.set(false);
      },
    });
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('/login')) {
      return '/dashboard';
    }

    return returnUrl;
  }
}
