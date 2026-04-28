import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { NotificationItem, NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (topRightToasts().length) {
      <div class="pointer-events-none fixed right-4 top-4 z-[95] flex w-full max-w-sm flex-col gap-3">
        @for (item of topRightToasts(); track item.id) {
          <article class="pointer-events-auto overflow-hidden rounded-2xl border bg-white/96 shadow-lg backdrop-blur"
            [class.border-emerald-200]="item.tone === 'success'"
            [class.border-rose-200]="item.tone === 'error'"
            [class.border-amber-200]="item.tone === 'warning'"
            [class.border-cyan-200]="item.tone === 'info'"
          >
            <div class="flex items-start gap-3 p-4">
              <span class="material-symbols-rounded mt-0.5"
                [class.text-emerald-700]="item.tone === 'success'"
                [class.text-rose-700]="item.tone === 'error'"
                [class.text-amber-700]="item.tone === 'warning'"
                [class.text-cyan-700]="item.tone === 'info'"
              >
                {{ icon(item.tone) }}
              </span>
              <div class="min-w-0 flex-1">
                @if (item.title) {
                  <p class="font-semibold text-slate-950">{{ item.title }}</p>
                }
                <p class="text-sm leading-6 text-slate-700" [class.mt-1]="item.title">{{ item.message }}</p>
              </div>
              @if (item.dismissible) {
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  (click)="notifications.remove(item.id)"
                  aria-label="Cerrar notificación"
                >
                  <span class="material-symbols-rounded text-[18px]">close</span>
                </button>
              }
            </div>
          </article>
        }
      </div>
    }

    @if (topCenterToasts().length) {
      <div class="pointer-events-none fixed inset-x-0 top-4 z-[95] flex justify-center px-4">
        <div class="flex w-full max-w-2xl flex-col gap-3">
          @for (item of topCenterToasts(); track item.id) {
            <article class="pointer-events-auto overflow-hidden rounded-2xl border bg-white/96 shadow-lg backdrop-blur"
              [class.border-emerald-200]="item.tone === 'success'"
              [class.border-rose-200]="item.tone === 'error'"
              [class.border-amber-200]="item.tone === 'warning'"
              [class.border-cyan-200]="item.tone === 'info'"
            >
              <div class="flex items-start gap-3 p-4">
                <span class="material-symbols-rounded mt-0.5"
                  [class.text-emerald-700]="item.tone === 'success'"
                  [class.text-rose-700]="item.tone === 'error'"
                  [class.text-amber-700]="item.tone === 'warning'"
                  [class.text-cyan-700]="item.tone === 'info'"
                >
                  {{ icon(item.tone) }}
                </span>
                <div class="min-w-0 flex-1">
                  @if (item.title) {
                    <p class="font-semibold text-slate-950">{{ item.title }}</p>
                  }
                  <p class="text-sm leading-6 text-slate-700" [class.mt-1]="item.title">{{ item.message }}</p>
                </div>
                @if (item.dismissible) {
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    (click)="notifications.remove(item.id)"
                    aria-label="Cerrar notificación"
                  >
                    <span class="material-symbols-rounded text-[18px]">close</span>
                  </button>
                }
              </div>
            </article>
          }
        </div>
      </div>
    }
  `,
})
export class ToastContainerComponent {
  protected readonly notifications = inject(NotificationService);
  protected readonly topRightToasts = computed(() =>
    this.notifications.notifications().filter((item) => item.position === 'top-right'),
  );
  protected readonly topCenterToasts = computed(() =>
    this.notifications.notifications().filter((item) => item.position === 'top-center'),
  );

  protected icon(tone: NotificationItem['tone']): string {
    if (tone === 'success') {
      return 'check_circle';
    }
    if (tone === 'error') {
      return 'error';
    }
    if (tone === 'warning') {
      return 'warning';
    }
    return 'info';
  }
}
