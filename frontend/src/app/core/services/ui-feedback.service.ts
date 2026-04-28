import { Injectable, inject, signal } from '@angular/core';
import { NotificationService } from './notification.service';

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
  private readonly notifications = inject(NotificationService);
  private confirmResolver: ((result: ConfirmResult) => void) | null = null;

  readonly confirmState = signal<ConfirmOptions | null>(null);

  success(title: string, message?: string): void {
    this.notifications.success(message || title, {
      title: message ? title : null,
    });
  }

  error(title: string, message?: string): void {
    this.notifications.error(message || title, {
      title: message ? title : null,
    });
  }

  warning(title: string, message?: string): void {
    this.notifications.warning(message || title, {
      title: message ? title : null,
    });
  }

  info(title: string, message?: string): void {
    this.notifications.info(message || title, {
      title: message ? title : null,
    });
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
}
