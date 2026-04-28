import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {authTokenInterceptor, ROADGIS_AUTH_TOKEN_STORAGE_KEY} from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(ROADGIS_AUTH_TOKEN_STORAGE_KEY);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(ROADGIS_AUTH_TOKEN_STORAGE_KEY);
  });

  it('adds bearer authorization header when a token is stored', () => {
    localStorage.setItem(ROADGIS_AUTH_TOKEN_STORAGE_KEY, 'test-token');

    http.get('/api/roads').subscribe();

    const request = httpMock.expectOne('/api/roads');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush([]);
  });

  it('leaves requests unchanged when token is missing', () => {
    http.get('/api/roads').subscribe();

    const request = httpMock.expectOne('/api/roads');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('leaves requests unchanged when token is blank', () => {
    localStorage.setItem(ROADGIS_AUTH_TOKEN_STORAGE_KEY, '   ');

    http.get('/api/roads').subscribe();

    const request = httpMock.expectOne('/api/roads');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });
});
