import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'teachers',
        loadComponent: () =>
          import('./features/teachers/pages/teachers-list/teachers-list.page').then(
            (m) => m.TeachersListPage,
          ),
      },
      {
        path: 'organizational/periods',
        loadComponent: () =>
          import('./features/organizational/pages/periods/periods.page').then(
            (m) => m.PeriodsPage,
          ),
      },
      {
        path: 'organizational/instances',
        loadComponent: () =>
          import('./features/organizational/pages/instances/instances.page').then(
            (m) => m.InstancesPage,
          ),
      },
      {
        path: 'organizational/position-groups',
        loadComponent: () =>
          import(
            './features/organizational/pages/position-groups/position-groups.page'
          ).then((m) => m.PositionGroupsPage),
      },
      {
        path: 'organizational/positions',
        loadComponent: () =>
          import('./features/organizational/pages/positions/positions.page').then(
            (m) => m.PositionsPage,
          ),
      },
      {
        path: 'organizational/documents',
        loadComponent: () =>
          import('./features/organizational/pages/documents/documents.page').then(
            (m) => m.DocumentsPage,
          ),
      },
      {
        path: 'organizational/incompatibility-rules',
        loadComponent: () =>
          import(
            './features/organizational/pages/incompatibility-rules/incompatibility-rules.page'
          ).then((m) => m.IncompatibilityRulesPage),
      },
      {
        path: 'organizational/appointments',
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