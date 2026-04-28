import {HttpInterceptorFn} from '@angular/common/http';

export const ROADGIS_AUTH_TOKEN_STORAGE_KEY = 'roadgis.auth.token';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem(ROADGIS_AUTH_TOKEN_STORAGE_KEY)?.trim();

  if (!token) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
