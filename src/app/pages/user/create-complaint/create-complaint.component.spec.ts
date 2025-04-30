import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateComplaintComponent } from './create-complaint.component';

describe('CreateComplaintComponent', () => {
  let component: CreateComplaintComponent;
  let fixture: ComponentFixture<CreateComplaintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateComplaintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateComplaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
