import { Routes } from '@angular/router';

import { DataManagementPageComponent } from './features/data-management/data-management-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'zarzadzanie-danymi',
  },
  {
    path: 'zarzadzanie-danymi',
    component: DataManagementPageComponent,
  },
];
