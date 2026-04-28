import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="rounded-2xl border p-4 shadow-sm"
      [ngClass]="containerClassMap()"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <p
            class="text-sm"
            [class.text-slate-500]="tone() === 'slate'"
            [class.text-cyan-700]="tone() === 'cyan'"
            [class.text-amber-700]="tone() === 'amber'"
            [class.text-emerald-700]="tone() === 'emerald'"
            [class.text-rose-700]="tone() === 'rose'"
          >
            {{ label() }}
          </p>
          <p class="mt-1.5 text-2xl font-bold text-slate-950">{{ value() }}</p>
          @if (hint()) {
            <p class="mt-1.5 text-xs uppercase tracking-[0.14em] text-slate-500">{{ hint() }}</p>
          }
        </div>

        @if (icon()) {
          <span
            class="material-symbols-rounded rounded-xl p-2.5"
            [ngClass]="iconClassMap()"
          >
            {{ icon() }}
          </span>
        }
      </div>
    </article>
  `,
})
export class SummaryCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly icon = input<string>('');
  readonly tone = input<'slate' | 'cyan' | 'amber' | 'emerald' | 'rose'>('slate');

  protected containerClassMap(): Record<string, boolean> {
    return {
      'border-slate-200/80': this.tone() === 'slate',
      'bg-white/96': this.tone() === 'slate',
      'border-cyan-200': this.tone() === 'cyan',
      'bg-cyan-50': this.tone() === 'cyan',
      'border-amber-200': this.tone() === 'amber',
      'bg-amber-50': this.tone() === 'amber',
      'border-emerald-200': this.tone() === 'emerald',
      'bg-emerald-50': this.tone() === 'emerald',
      'border-rose-200': this.tone() === 'rose',
      'bg-rose-50': this.tone() === 'rose',
    };
  }

  protected iconClassMap(): Record<string, boolean> {
    return {
      'bg-slate-100': this.tone() === 'slate',
      'text-slate-700': this.tone() === 'slate',
      'bg-white/80': this.tone() !== 'slate',
      'text-cyan-700': this.tone() === 'cyan',
      'text-amber-700': this.tone() === 'amber',
      'text-emerald-700': this.tone() === 'emerald',
      'text-rose-700': this.tone() === 'rose',
    };
  }
}
