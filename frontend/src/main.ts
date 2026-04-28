import {bootstrapApplication} from '@angular/platform-browser';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter} from '@angular/router';

import {AppComponent} from './app/app.component';
import {appRoutes} from './app/app.routes';
import {authTokenInterceptor} from './app/core/auth-token.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideRouter(appRoutes)
  ]
}).catch((error: unknown) => console.error(error));
