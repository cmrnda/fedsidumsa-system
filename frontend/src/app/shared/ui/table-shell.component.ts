import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-table-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-surface overflow-hidden rounded-2xl">
      <div class="overflow-x-auto">
        <ng-content />
      </div>

      @if (empty()) {
        <div class="px-6 py-10 text-center text-sm text-slate-500">{{ emptyMessage() }}</div>
      }
    </div>
  `,
})
export class TableShellComponent {
  readonly empty = input(false);
  readonly emptyMessage = input('No hay registros para mostrar.');
}
