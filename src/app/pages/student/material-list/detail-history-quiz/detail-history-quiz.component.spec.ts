import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailHistoryQuizComponent } from './detail-history-quiz.component';

describe('DetailHistoryQuizComponent', () => {
  let component: DetailHistoryQuizComponent;
  let fixture: ComponentFixture<DetailHistoryQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailHistoryQuizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailHistoryQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
