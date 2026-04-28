import { Routes } from '@angular/router';

import { authChildGuard, authGuard, roleGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    data: {
      section: 'Acceso',
      title: 'Ingreso administrativo',
      description: 'Acceso privado para gestión interna.',
    },
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'certificates/public',
    data: {
      section: 'Consulta pública',
      title: 'Consulta y validación de certificados',
      description: 'Consulta externa controlada de certificados habilitados.',
    },
    loadComponent: () =>
      import('./features/certificates/pages/public-certificates/public-certificates.page').then(
        (m) => m.PublicCertificatesPage,
      ),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'dashboard',
        data: {
          section: 'Operación diaria',
          title: 'Inicio operativo',
          description: 'Pendientes, revisión y seguimiento de la jornada.',
        },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'teachers',
        data: {
          section: 'Operación diaria',
          title: 'Docentes',
          description: 'Búsqueda, registro y revisión rápida de docentes.',
        },
        loadComponent: () =>
          import('./features/teachers/pages/teachers-list/teachers-list.page').then(
            (m) => m.TeachersListPage,
          ),
      },
      {
        path: 'certificates',
        data: {
          section: 'Operación diaria',
          title: 'Certificados',
          description: 'Solicitudes, revisión y emisión institucional.',
        },
        loadComponent: () =>
          import('./features/certificates/pages/certificates/certificates.page').then(
            (m) => m.CertificatesPage,
          ),
      },
      {
        path: 'certificates/setup',
        data: {
          section: 'Configuración de certificados',
          title: 'Catálogos de certificados',
          description: 'Tipos, plantillas, eventos y participaciones.',
        },
        loadComponent: () =>
          import('./features/certificates/pages/certificates-setup/certificates-setup.page').then(
            (m) => m.CertificatesSetupPage,
          ),
      },
      {
        path: 'certificates/:id',
        data: {
          section: 'Operación diaria',
          title: 'Detalle de certificado',
          description: 'Estado, historial y acciones del trámite.',
        },
        loadComponent: () =>
          import('./features/certificates/pages/certificate-detail/certificate-detail.page').then(
            (m) => m.CertificateDetailPage,
          ),
      },
      {
        path: 'debts',
        data: {
          section: 'Operación diaria',
          title: 'Validación financiera',
          description: 'Estado de cuenta y elegibilidad para no adeudo.',
        },
        loadComponent: () =>
          import('./features/debts/pages/debts/debts.page').then((m) => m.DebtsPage),
      },
      {
        path: 'settings/users',
        canActivate: [roleGuard],
        data: {
          section: 'Configuración del sistema',
          title: 'Usuarios',
          description: 'Cuentas, roles y estado de acceso al sistema.',
          roles: ['admin'],
        },
        loadComponent: () =>
          import('./features/users/pages/users/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'organizational/periods',
        data: {
          section: 'Configuración organizacional',
          title: 'Periodos',
          description: 'Gestión de periodos administrativos.',
        },
        loadComponent: () =>
          import('./features/organizational/pages/periods/periods.page').then(
            (m) => m.PeriodsPage,
          ),
      },
      {
        path: 'organizational/instances',
        data: {
          section: 'Configuración organizacional',
          title: 'Instancias',
          description: 'Estructura organizacional vigente.',
        },
        loadComponent: () =>
          import('./features/organizational/pages/instances/instances.page').then(
            (m) => m.InstancesPage,
          ),
      },
      {
        path: 'organizational/position-groups',
        data: {
          section: 'Configuración organizacional',
          title: 'Grupos de cargo',
          description: 'Clasificación base de cargos.',
        },
        loadComponent: () =>
          import(
            './features/organizational/pages/position-groups/position-groups.page'
          ).then((m) => m.PositionGroupsPage),
      },
      {
        path: 'organizational/positions',
        data: {
          section: 'Configuración organizacional',
          title: 'Cargos',
          description: 'Cargos disponibles por instancia.',
        },
        loadComponent: () =>
          import('./features/organizational/pages/positions/positions.page').then(
            (m) => m.PositionsPage,
          ),
      },
      {
        path: 'organizational/documents',
        data: {
          section: 'Configuración organizacional',
          title: 'Documentos',
          description: 'Respaldo documental para designaciones.',
        },
        loadComponent: () =>
          import('./features/organizational/pages/documents/documents.page').then(
            (m) => m.DocumentsPage,
          ),
      },
      {
        path: 'organizational/incompatibility-rules',
        data: {
          section: 'Configuración organizacional',
          title: 'Reglas de incompatibilidad',
          description: 'Restricciones entre grupos y cargos.',
        },
        loadComponent: () =>
          import(
            './features/organizational/pages/incompatibility-rules/incompatibility-rules.page'
          ).then((m) => m.IncompatibilityRulesPage),
      },
      {
        path: 'organizational/appointments',
        data: {
          section: 'Operación diaria',
          title: 'Designaciones',
          description: 'Asignación de docentes a cargos y vigencias.',
        },
        loadComponent: () =>
          import(
            './features/organizational/pages/appointments/appointments.page'
          ).then((m) => m.AppointmentsPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
