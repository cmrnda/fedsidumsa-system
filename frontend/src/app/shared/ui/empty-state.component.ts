import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-surface rounded-2xl px-6 py-9 text-center">
      <span class="material-symbols-rounded rounded-2xl bg-cyan-50 p-3 text-cyan-700 ring-1 ring-cyan-100">{{ icon() }}</span>
      <h3 class="mt-4 text-lg font-bold text-slate-950">{{ title() }}</h3>
      <p class="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{{ description() }}</p>
      <div class="mt-5 flex items-center justify-center gap-3">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input<string>('inbox');
}
