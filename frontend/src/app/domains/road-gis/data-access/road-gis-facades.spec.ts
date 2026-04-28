import {TestBed} from '@angular/core/testing';

import {LayerFacade, RoadGisWorkflowFacade} from './road-gis-facades';

describe('road GIS production facades', () => {
  it('exposes a production layer tree with editable ZID layers', () => {
    const facade = TestBed.inject(LayerFacade);

    expect(facade.layers().some((layer) => layer.group === 'Obiekty ZID' && layer.editable)).toBeTrue();
    expect(facade.mapComposition().name).toContain('Mapa techniczno');
  });

  it('switches clickable workflows and remembers selected step per workflow', () => {
    const facade = TestBed.inject(RoadGisWorkflowFacade);

    facade.activate('parcel-import');
    facade.setStep('parcel-import', 3);

    expect(facade.activeWorkflow().title).toContain('Import działek');
    expect(facade.activeStep()?.id).toBe('diff');
  });
});
