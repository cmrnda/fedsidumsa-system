import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';

export const SKIP_HTTP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!req.context.get(SKIP_HTTP_ERROR_NOTIFICATION)) {
        const message = getHttpErrorMessage(error);
        const title = getHttpErrorTitle(error.status);
        notifications.error(message, {
          title,
          duration: error.status >= 500 || error.status === 0 ? 6000 : 4500,
        });
      }

      return throwError(() => error);
    }),
  );
};

function getHttpErrorTitle(status: number): string {
  if (status === 0) {
    return 'Sin conexión con el servidor';
  }
  if (status === 401) {
    return 'Sesión no válida';
  }
  if (status === 403) {
    return 'Acceso denegado';
  }
  if (status === 404) {
    return 'Recurso no encontrado';
  }
  if (status >= 500) {
    return 'Error del servidor';
  }
  return 'No se pudo completar la solicitud';
}

function getHttpErrorMessage(error: HttpErrorResponse): string {
  const payload = error.error as
    | {
        message?: string;
        errors?: Record<string, string[]>;
      }
    | undefined;

  const firstValidationError = payload?.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : undefined;

  if (firstValidationError) {
    return firstValidationError;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (error.status === 0) {
    return 'No fue posible comunicarse con el backend. Revise el servidor o la red local.';
  }

  if (error.status === 401) {
    return 'Necesita iniciar sesión nuevamente para continuar.';
  }

  if (error.status === 403) {
    return 'No tiene permisos para realizar esta acción.';
  }

  if (error.status === 404) {
    return 'El recurso solicitado no existe o ya no está disponible.';
  }

  if (error.status >= 500) {
    return 'Ocurrió un error interno al procesar la solicitud.';
  }

  return 'Ocurrió un error inesperado durante la solicitud.';
}
