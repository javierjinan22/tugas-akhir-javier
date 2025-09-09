import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherViewStudentQuizResultComponent } from './teacher-view-student-quiz-result.component';

describe('TeacherViewStudentQuizResultComponent', () => {
  let component: TeacherViewStudentQuizResultComponent;
  let fixture: ComponentFixture<TeacherViewStudentQuizResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeacherViewStudentQuizResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherViewStudentQuizResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
