import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-8 text-slate-600">
      <div class="flex items-center gap-3">
        <span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-700"></span>
        <span class="text-sm font-semibold">{{ message() }}</span>
      </div>
    </div>
  `,
})
export class LoadingStateComponent {
  readonly message = input('Cargando información...');
}
