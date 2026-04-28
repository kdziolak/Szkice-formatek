import {TestBed} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';
import {forkJoin, type Observable} from 'rxjs';

import {RoadInfraGisApiService} from './road-infra-gis-api.service';

describe('RoadInfraGisApiService preview data', () => {
  let service: RoadInfraGisApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RoadInfraGisApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('serves startup preview endpoints without backend HTTP requests', () => {
    const responses: Observable<unknown[]>[] = [
      service.roads(),
      service.referenceSegments(),
      service.infrastructureObjects(),
      service.roadSections(),
      service.validationIssues(),
      service.layers(),
      service.workspaces()
    ];

    forkJoin(responses).subscribe((collections) => {
      collections.forEach((items) => expect(items.length).toBeGreaterThan(0));
    });

    httpMock.expectNone('/api/roads');
    httpMock.expectNone('/api/reference-segments');
    httpMock.expectNone('/api/infrastructure-objects');
    httpMock.expectNone('/api/road-sections');
    httpMock.expectNone('/api/reports/validation-issues');
    httpMock.expectNone('/api/layers');
    httpMock.expectNone('/api/workspaces');
  });
});
