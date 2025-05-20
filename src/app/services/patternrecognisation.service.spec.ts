import { TestBed } from '@angular/core/testing';

import { PatternrecognisationService } from './patternrecognisation.service';

describe('PatternrecognisationService', () => {
  let service: PatternrecognisationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatternrecognisationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
