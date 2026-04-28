import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fedsidumsa_token';
const USER_KEY = 'fedsidumsa_user';

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(token: string, user: unknown): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      this.clearSession();
      return null;
    }
  }

  hasValidToken(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    const expiration = this.getTokenExpiration(token);

    if (!expiration) {
      return true;
    }

    if (Date.now() >= expiration) {
      this.clearSession();
      return false;
    }

    return true;
  }

  private getTokenExpiration(token: string): number | null {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const decoded = JSON.parse(atob(padded)) as { exp?: number };
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
