import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnstileComponent } from './turnstile.component';

describe('TurnstileComponent', () => {
  let component: TurnstileComponent;
  let fixture: ComponentFixture<TurnstileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TurnstileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TurnstileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
