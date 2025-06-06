import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherRegistrationModalComponent } from './teacher-registration-modal.component';

describe('TeacherRegistrationModalComponent', () => {
  let component: TeacherRegistrationModalComponent;
  let fixture: ComponentFixture<TeacherRegistrationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeacherRegistrationModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherRegistrationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
