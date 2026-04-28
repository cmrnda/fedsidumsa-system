import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-4 border-t border-slate-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm text-slate-600">
        Mostrando <strong class="text-slate-950">{{ start() }}</strong> a
        <strong class="text-slate-950">{{ end() }}</strong> de
        <strong class="text-slate-950">{{ total() }}</strong> registros
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <span>Filas por página</span>
          <select
            class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            [value]="perPage()"
            (change)="onPerPageChange($event)"
          >
            @for (option of perPageOptions(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </label>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
            aria-label="Página anterior"
          >
            <span class="material-symbols-rounded text-[18px]">chevron_left</span>
          </button>

          <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            Página {{ page() }} de {{ pages() }}
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="page() >= pages()"
            (click)="pageChange.emit(page() + 1)"
            aria-label="Página siguiente"
          >
            <span class="material-symbols-rounded text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly perPage = input.required<number>();
  readonly total = input.required<number>();
  readonly start = input.required<number>();
  readonly end = input.required<number>();
  readonly perPageOptions = input<number[]>([10, 20, 50]);
  readonly pageChange = output<number>();
  readonly perPageChange = output<number>();

  protected onPerPageChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value || 10);
    this.perPageChange.emit(value);
  }
}
