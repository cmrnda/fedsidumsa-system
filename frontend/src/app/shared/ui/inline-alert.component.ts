import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-inline-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border px-4 py-3.5 shadow-sm" [ngClass]="containerClassMap()">
      <div class="flex items-start gap-3">
        <span
          class="material-symbols-rounded mt-0.5 rounded-xl bg-white p-2"
          [ngClass]="iconClassMap()"
        >
          {{ icon() }}
        </span>
        <div class="min-w-0">
          <p class="font-bold text-slate-950">{{ title() }}</p>
          <p class="mt-1 text-sm leading-6 text-slate-700">{{ message() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class InlineAlertComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly tone = input<'info' | 'accent' | 'warning' | 'danger' | 'success'>('info');
  readonly icon = input<string>('info');

  protected containerClassMap(): Record<string, boolean> {
    return {
      'border-slate-200 bg-slate-50': this.tone() === 'info',
      'border-cyan-200 bg-cyan-50': this.tone() === 'accent',
      'border-amber-200 bg-amber-50': this.tone() === 'warning',
      'border-rose-200 bg-rose-50': this.tone() === 'danger',
      'border-emerald-200 bg-emerald-50': this.tone() === 'success',
    };
  }

  protected iconClassMap(): Record<string, boolean> {
    return {
      'text-slate-700': this.tone() === 'info',
      'text-cyan-700': this.tone() === 'accent',
      'text-amber-700': this.tone() === 'warning',
      'text-rose-700': this.tone() === 'danger',
      'text-emerald-700': this.tone() === 'success',
    };
  }
}
