import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'data-management'
  },
  {
    path: 'data-management',
    loadComponent: () =>
      import('./features/data-management/data-management-page.component').then(
        (module) => module.DataManagementPageComponent
      )
  },
  {
    path: '**',
    redirectTo: 'data-management'
  }
];
