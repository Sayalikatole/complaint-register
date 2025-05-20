import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternrecognisationComponent } from './patternrecognisation.component';

describe('PatternrecognisationComponent', () => {
  let component: PatternrecognisationComponent;
  let fixture: ComponentFixture<PatternrecognisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternrecognisationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatternrecognisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
