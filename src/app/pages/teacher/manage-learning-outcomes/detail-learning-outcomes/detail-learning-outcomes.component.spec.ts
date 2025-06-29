import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailLearningOutcomesComponent } from './detail-learning-outcomes.component';

describe('DetailLearningOutcomesComponent', () => {
  let component: DetailLearningOutcomesComponent;
  let fixture: ComponentFixture<DetailLearningOutcomesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailLearningOutcomesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailLearningOutcomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
