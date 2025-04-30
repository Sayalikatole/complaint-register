import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComplaintComponent } from './list-complaint.component';

describe('ListComplaintComponent', () => {
  let component: ListComplaintComponent;
  let fixture: ComponentFixture<ListComplaintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComplaintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListComplaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
