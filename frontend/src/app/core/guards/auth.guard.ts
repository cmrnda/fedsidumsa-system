import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthStorageService } from '../services/auth-storage.service';

function authorize(returnUrl: string): true | UrlTree {
  const authStorage = inject(AuthStorageService);
  const router = inject(Router);

  if (authStorage.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl },
  });
}

export const authGuard: CanActivateFn = (_route, state) => authorize(state.url);
export const authChildGuard: CanActivateChildFn = (_route, state) => authorize(state.url);

export const roleGuard: CanActivateFn = (route, state) => {
  const authStorage = inject(AuthStorageService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[] | undefined) || [];

  if (!authStorage.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!roles.length) {
    return true;
  }

  const user = authStorage.getUser<{ role?: string }>();
  return user?.role && roles.includes(user.role) ? true : router.createUrlTree(['/dashboard']);
};
