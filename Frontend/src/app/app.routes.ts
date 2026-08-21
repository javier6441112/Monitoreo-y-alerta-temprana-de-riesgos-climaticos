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
        loadComponent: () => import('./features/sensores/list/list.component').then(m => m.ListComponent)
      },
      {
        path: 'sensores/nuevo',
        loadComponent: () => import('./features/sensores/form/form.component').then(m => m.FormComponent)
      },
      {
        path: 'sensores/editar/:id',
        loadComponent: () => import('./features/sensores/form/form.component').then(m => m.FormComponent)
      },
      {
        path: 'alertas',
        loadComponent: () => import('./features/alertas/list/list.component').then(m => m.ListComponent)
      },
      {
        path: 'historial',
        loadComponent: () => import('./features/historial/main/main.component').then(m => m.MainComponent)
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
