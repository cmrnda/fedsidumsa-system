import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-section-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="app-surface rounded-2xl p-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            @if (icon()) {
              <span class="material-symbols-rounded rounded-xl bg-slate-100/90 p-2.5 text-slate-700 ring-1 ring-slate-200">{{ icon() }}</span>
            }
            <div>
              <h2 class="text-lg font-bold text-slate-950">{{ title() }}</h2>
              @if (description()) {
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ description() }}</p>
              }
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <ng-content select="[section-actions]" />
        </div>
      </div>

      <div class="mt-5">
        <ng-content />
      </div>
    </section>
  `,
})
export class SectionCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
}
