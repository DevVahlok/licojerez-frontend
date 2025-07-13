import { TestBed } from '@angular/core/testing';

import { TabulatorService } from './tabulator.service';

describe('TabulatorService', () => {
  let service: TabulatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabulatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
