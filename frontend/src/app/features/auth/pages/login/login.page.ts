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
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div class="mb-8">
          <p class="text-sm font-medium text-slate-500">Administrative access</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Sign in</h1>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              formControlName="username"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
              type="text"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              formControlName="password"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
              type="password"
            />
          </div>

          @if (error()) {
            <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
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
        this.error.set('Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}