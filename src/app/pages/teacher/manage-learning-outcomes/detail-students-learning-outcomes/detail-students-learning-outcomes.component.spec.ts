import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailStudentsLearningOutcomesComponent } from './detail-students-learning-outcomes.component';

describe('DetailStudentsLearningOutcomesComponent', () => {
  let component: DetailStudentsLearningOutcomesComponent;
  let fixture: ComponentFixture<DetailStudentsLearningOutcomesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailStudentsLearningOutcomesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailStudentsLearningOutcomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
