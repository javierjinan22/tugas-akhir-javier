import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStudentAccountComponent } from './create-student-account.component';

describe('CreateStudentAccountComponent', () => {
  let component: CreateStudentAccountComponent;
  let fixture: ComponentFixture<CreateStudentAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateStudentAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateStudentAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
