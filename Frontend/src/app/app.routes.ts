import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'sensores',
        loadComponent: () => import('./features/sensores/sensores.component').then(m => m.SensoresComponent)
      },
      {
        path: 'alertas',
        loadComponent: () => import('./features/alertas/alertas.component').then(m => m.AlertasComponent)
      },
      {
        path: 'historial',
        loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
