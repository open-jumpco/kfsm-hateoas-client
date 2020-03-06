import { TestBed } from '@angular/core/testing';

import { TurnstileApiService } from './turnstile-api.service';

describe('TurnstileApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TurnstileApiService = TestBed.get(TurnstileApiService);
    expect(service).toBeTruthy();
  });
});
