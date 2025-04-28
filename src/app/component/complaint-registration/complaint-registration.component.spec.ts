import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplaintRegistrationComponent } from './complaint-registration.component';

describe('ComplaintRegistrationComponent', () => {
  let component: ComplaintRegistrationComponent;
  let fixture: ComponentFixture<ComplaintRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplaintRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplaintRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
