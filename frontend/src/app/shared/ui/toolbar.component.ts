import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="app-toolbar">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          @if (title()) {
            <h2 class="text-base font-bold text-slate-950">{{ title() }}</h2>
          }
          @if (description()) {
            <p class="mt-1 text-sm leading-6 text-slate-500">{{ description() }}</p>
          }
          <div class="flex flex-wrap items-center gap-3" [class.mt-3]="title() || description()">
            <ng-content />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 lg:justify-end">
          <ng-content select="[toolbar-actions]" />
        </div>
      </div>
    </section>
  `,
})
export class ToolbarComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
}
