import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLearningOutcomesComponent } from './manage-learning-outcomes.component';

describe('ManageLearningOutcomesComponent', () => {
  let component: ManageLearningOutcomesComponent;
  let fixture: ComponentFixture<ManageLearningOutcomesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageLearningOutcomesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageLearningOutcomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
