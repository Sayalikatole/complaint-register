import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HodLayoutComponent } from './hod-layout.component';

describe('HodLayoutComponent', () => {
  let component: HodLayoutComponent;
  let fixture: ComponentFixture<HodLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HodLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HodLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
