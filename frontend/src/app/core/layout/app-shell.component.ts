import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStorageService } from '../services/auth-storage.service';

interface SessionUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [NgFor, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-100 text-slate-900">
      <div class="flex min-h-screen">
        <aside class="hidden w-80 bg-slate-900 text-white lg:block">
          <div class="border-b border-slate-800 px-6 py-5">
            <h1 class="text-lg font-semibold">FEDSIDUMSA</h1>
            <p class="mt-1 text-sm text-slate-400">Administrative System</p>
          </div>

          <nav class="space-y-5 px-3 py-4">
            <div>
              <p class="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                General
              </p>
              <div class="space-y-1">
                <a
                  *ngFor="let item of generalMenu"
                  [routerLink]="item.link"
                  routerLinkActive="bg-slate-800 text-white"
                  class="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {{ item.label }}
                </a>
              </div>
            </div>

            <div>
              <p class="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Organizational
              </p>
              <div class="space-y-1">
                <a
                  *ngFor="let item of organizationalMenu"
                  [routerLink]="item.link"
                  routerLinkActive="bg-slate-800 text-white"
                  class="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {{ item.label }}
                </a>
              </div>
            </div>
          </nav>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
          <header class="border-b border-slate-200 bg-white">
            <div class="flex items-center justify-between px-6 py-4">
              <div>
                <p class="text-sm text-slate-500">Internal platform</p>
                <h2 class="text-lg font-semibold text-slate-900">FEDSIDUMSA UMSA</h2>
              </div>

              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-sm font-medium text-slate-900">{{ user()?.full_name || 'User' }}</p>
                  <p class="text-xs uppercase tracking-wide text-slate-500">{{ user()?.role || 'Role' }}</p>
                </div>

                <button
                  type="button"
                  (click)="logout()"
                  class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main class="flex-1 p-6">
            <router-outlet />
          </main>
        </div>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  private readonly authStorage = inject(AuthStorageService);
  private readonly router = inject(Router);

  protected readonly generalMenu = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Teachers', link: '/teachers' },
  ];

  protected readonly organizationalMenu = [
    { label: 'Periods', link: '/organizational/periods' },
    { label: 'Instances', link: '/organizational/instances' },
    { label: 'Position Groups', link: '/organizational/position-groups' },
    { label: 'Positions', link: '/organizational/positions' },
    { label: 'Documents', link: '/organizational/documents' },
    { label: 'Incompatibility Rules', link: '/organizational/incompatibility-rules' },
    { label: 'Appointments', link: '/organizational/appointments' },
  ];

  protected user(): SessionUser | null {
    return this.authStorage.getUser<SessionUser>();
  }

  logout(): void {
    this.authStorage.clearSession();
    this.router.navigate(['/login']);
  }
}