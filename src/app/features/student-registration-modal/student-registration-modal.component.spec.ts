import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentRegistrationModalComponent } from './student-registration-modal.component';

describe('StudentRegistrationModalComponent', () => {
  let component: StudentRegistrationModalComponent;
  let fixture: ComponentFixture<StudentRegistrationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentRegistrationModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentRegistrationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
