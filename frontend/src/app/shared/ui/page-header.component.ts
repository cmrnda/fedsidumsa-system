import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-surface rounded-2xl p-5 backdrop-blur sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0">
          @if (backLink()) {
            <a [routerLink]="backLink()" class="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              <span class="material-symbols-rounded text-[18px]">arrow_back</span>
              {{ backLabel() || 'Volver' }}
            </a>
          }

          @if (eyebrow()) {
            <p class="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{{ eyebrow() }}</p>
          }

          <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{{ title() }}</h1>

          @if (description()) {
            <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{{ description() }}</p>
          }
        </div>

        <div class="flex flex-wrap gap-3 lg:justify-end">
          <ng-content select="[header-actions]" />
        </div>
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly backLink = input<string | null>(null);
  readonly backLabel = input<string>('');
}
