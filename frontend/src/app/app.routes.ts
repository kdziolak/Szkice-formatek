import {Routes} from '@angular/router';

import {DataManagementPageComponent} from './features/data-management/data-management-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: DataManagementPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
