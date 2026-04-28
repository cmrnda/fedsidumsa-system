import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top-right' | 'top-center';

export interface NotificationItem {
  id: number;
  tone: NotificationTone;
  title?: string | null;
  message: string;
  duration: number;
  position: NotificationPosition;
  dismissible: boolean;
}

export interface NotificationOptions {
  title?: string | null;
  duration?: number;
  position?: NotificationPosition;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 0;
  private readonly recentFingerprints = new Map<string, number>();

  readonly notifications = signal<NotificationItem[]>([]);

  success(message: string, options?: NotificationOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: NotificationOptions): void {
    this.show('error', message, options);
  }

  warning(message: string, options?: NotificationOptions): void {
    this.show('warning', message, options);
  }

  info(message: string, options?: NotificationOptions): void {
    this.show('info', message, options);
  }

  remove(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }

  private show(tone: NotificationTone, message: string, options?: NotificationOptions): void {
    const normalizedMessage = (message || '').trim();
    if (!normalizedMessage) {
      return;
    }

    const title = options?.title?.trim() || null;
    const fingerprint = `${tone}|${title || ''}|${normalizedMessage}`;
    const now = Date.now();
    const previousTimestamp = this.recentFingerprints.get(fingerprint);

    if (previousTimestamp && now - previousTimestamp < 900) {
      return;
    }

    this.recentFingerprints.set(fingerprint, now);

    const item: NotificationItem = {
      id: ++this.nextId,
      tone,
      title,
      message: normalizedMessage,
      duration: options?.duration ?? 4200,
      position: options?.position ?? 'top-right',
      dismissible: options?.dismissible ?? true,
    };

    this.notifications.update((items) => [...items, item]);

    if (item.duration > 0) {
      window.setTimeout(() => {
        this.remove(item.id);
      }, item.duration);
    }
  }
}
