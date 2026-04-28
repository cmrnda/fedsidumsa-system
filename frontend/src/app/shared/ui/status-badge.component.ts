import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold"
      [class.border-slate-200]="tone() === 'slate'"
      [class.bg-slate-50]="tone() === 'slate'"
      [class.text-slate-700]="tone() === 'slate'"
      [class.border-cyan-200]="tone() === 'cyan'"
      [class.bg-cyan-50]="tone() === 'cyan'"
      [class.text-cyan-800]="tone() === 'cyan'"
      [class.border-amber-200]="tone() === 'amber'"
      [class.bg-amber-50]="tone() === 'amber'"
      [class.text-amber-800]="tone() === 'amber'"
      [class.border-emerald-200]="tone() === 'emerald'"
      [class.bg-emerald-50]="tone() === 'emerald'"
      [class.text-emerald-800]="tone() === 'emerald'"
      [class.border-rose-200]="tone() === 'rose'"
      [class.bg-rose-50]="tone() === 'rose'"
      [class.text-rose-800]="tone() === 'rose'"
    >
      @if (icon()) {
        <span class="material-symbols-rounded text-[14px]">{{ icon() }}</span>
      }
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly icon = input<string>('');
  readonly tone = input<'slate' | 'cyan' | 'amber' | 'emerald' | 'rose'>('slate');
}
