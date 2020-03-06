import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnstileListComponent } from './turnstile-list.component';

describe('TurnstileListComponent', () => {
  let component: TurnstileListComponent;
  let fixture: ComponentFixture<TurnstileListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TurnstileListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TurnstileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
