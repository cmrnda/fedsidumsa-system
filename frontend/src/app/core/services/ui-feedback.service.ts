import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  title: string;
  message?: string | null;
  tone: ToastTone;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger' | 'success' | 'warning';
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

export interface ConfirmResult {
  confirmed: boolean;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  private toastId = 0;
  private confirmResolver: ((result: ConfirmResult) => void) | null = null;

  readonly toasts = signal<ToastItem[]>([]);
  readonly confirmState = signal<ConfirmOptions | null>(null);

  success(title: string, message?: string): void {
    this.showToast('success', title, message);
  }

  error(title: string, message?: string): void {
    this.showToast('error', title, message);
  }

  warning(title: string, message?: string): void {
    this.showToast('warning', title, message);
  }

  info(title: string, message?: string): void {
    this.showToast('info', title, message);
  }

  removeToast(id: number): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }

  confirm(options: ConfirmOptions): Promise<ConfirmResult> {
    this.confirmState.set(options);

    return new Promise<ConfirmResult>((resolve) => {
      this.confirmResolver = resolve;
    });
  }

  resolveConfirm(result: ConfirmResult): void {
    if (this.confirmResolver) {
      this.confirmResolver(result);
      this.confirmResolver = null;
    }

    this.confirmState.set(null);
  }

  private showToast(tone: ToastTone, title: string, message?: string): void {
    const id = ++this.toastId;
    const item: ToastItem = { id, tone, title, message };

    this.toasts.update((items) => [...items, item]);

    window.setTimeout(() => {
      this.removeToast(id);
    }, 4200);
  }
}
