import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'ui-action-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left">
      <button
        type="button"
        class="app-icon-button"
        (click)="toggle()"
        [attr.aria-label]="label()"
        [attr.aria-expanded]="open()"
      >
        <span class="material-symbols-rounded text-[20px]">{{ icon() }}</span>
      </button>

      @if (open()) {
        <button
          type="button"
          class="fixed inset-0 z-10 cursor-default bg-transparent"
          aria-label="Cerrar menú"
          (click)="close()"
        ></button>
        <div class="absolute right-0 z-20 mt-2 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class ActionMenuComponent {
  readonly label = input('Acciones');
  readonly icon = input('more_vert');
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }
}
