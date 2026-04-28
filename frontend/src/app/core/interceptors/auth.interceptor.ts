import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthStorageService } from '../services/auth-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStorage = inject(AuthStorageService);
  const router = inject(Router);
  const token = authStorage.getToken();
  const isPublicRequest = req.url.includes('/api/public/');
  const isLoginRequest = req.url.includes('/auth/login');

  if (isPublicRequest || isLoginRequest) {
    return next(req);
  }

  if (!authStorage.hasValidToken()) {
    authStorage.clearSession();
    router.navigate(['/login'], {
      queryParams: { returnUrl: router.url },
    });
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authStorage.clearSession();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      return throwError(() => error);
    }),
  );
};
