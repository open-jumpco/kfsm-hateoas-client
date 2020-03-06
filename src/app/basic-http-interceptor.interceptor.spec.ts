import { TestBed } from '@angular/core/testing';

import { BasicHttpInterceptor } from './basic-http-interceptor.service';

describe('BasicHttpInterceptorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      BasicHttpInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: BasicHttpInterceptor = TestBed.inject(BasicHttpInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
