import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStorageService } from '../../../../core/services/auth-storage.service';
import { AuthApi } from '../../data-access/auth.api';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <div class="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/8 lg:grid-cols-[1.1fr,0.9fr]">
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white sm:p-10">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">FEDSIDUMSA UMSA</p>
          <h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Sistema administrativo interno</h1>
          <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
            Acceda para gestionar docentes, estructura organizativa y designaciones desde un flujo simple para personal administrativo.
          </p>

          <div class="mt-8 space-y-4">
            <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <span class="material-symbols-rounded text-cyan-200">groups</span>
              <div>
                <p class="font-semibold text-white">Docentes</p>
                <p class="mt-1 text-sm text-slate-300">Registro y consulta de datos básicos.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <span class="material-symbols-rounded text-cyan-200">lan</span>
              <div>
                <p class="font-semibold text-white">Organización</p>
                <p class="mt-1 text-sm text-slate-300">Periodos, instancias, cargos y reglas de incompatibilidad.</p>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <span class="material-symbols-rounded text-cyan-200">assignment_ind</span>
              <div>
                <p class="font-semibold text-white">Designaciones</p>
                <p class="mt-1 text-sm text-slate-300">Validación clara de asignaciones y conflictos.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 sm:p-10">
          <div class="mb-8">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Ingreso administrativo</p>
            <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Iniciar sesión</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Use sus credenciales para continuar con la gestión interna.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Usuario</span>
              <input
                formControlName="username"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600"
                type="text"
                placeholder="Ingrese su usuario"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
              <input
                formControlName="password"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600"
                type="password"
                placeholder="Ingrese su contraseña"
              />
            </label>

            @if (error()) {
              <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ error() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
        this.router.navigate(['/dashboard']);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Credenciales inválidas');
        this.loading.set(false);
      },
    });
  }
}
