import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSuggestionComponent } from './list-suggestion.component';

describe('ListSuggestionComponent', () => {
  let component: ListSuggestionComponent;
  let fixture: ComponentFixture<ListSuggestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSuggestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSuggestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
