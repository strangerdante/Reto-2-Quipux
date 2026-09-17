import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'components'
      },
      {
        path: 'components',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/resources/resources.component').then(m => m.ResourcesComponent)
      },
      {
        path: 'integration',
        loadComponent: () =>
          import('./features/integration/integration.component').then(m => m.IntegrationComponent)
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then(m => m.AuditComponent)
      },
      {
        path: 'editor',
        loadComponent: () =>
          import('./features/editor/editor.component').then(m => m.EditorComponent)
      },
      {
        path: 'editor/:id',
        loadComponent: () =>
          import('./features/editor/editor.component').then(m => m.EditorComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'components'
  }
];
