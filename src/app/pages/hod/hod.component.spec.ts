import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HodComponent } from './hod.component';

describe('HodComponent', () => {
  let component: HodComponent;
  let fixture: ComponentFixture<HodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
