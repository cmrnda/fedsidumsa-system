import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-slide-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[75]">
        <div class="absolute inset-0 bg-slate-950/45" (click)="closed.emit()"></div>
        <aside class="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col border-l border-slate-200 bg-white shadow-xl">
          <div class="border-b border-slate-200 px-5 py-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                @if (eyebrow()) {
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{{ eyebrow() }}</p>
                }
                <h2 class="mt-1 text-xl font-bold text-slate-950">{{ title() }}</h2>
                @if (description()) {
                  <p class="mt-2 text-sm text-slate-500">{{ description() }}</p>
                }
              </div>

              <button
                type="button"
                (click)="closed.emit()"
                class="app-icon-button"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <ng-content />
          </div>

          <div class="border-t border-slate-200 px-5 py-4">
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ng-content select="[drawer-actions]" />
            </div>
          </div>
        </aside>
      </div>
    }
  `,
})
export class SlideOverComponent {
  readonly open = input(false);
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly closed = output<void>();
}
