import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddStudentToClassComponent } from './modal-add-student-to-class.component';

describe('ModalAddStudentToClassComponent', () => {
  let component: ModalAddStudentToClassComponent;
  let fixture: ComponentFixture<ModalAddStudentToClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalAddStudentToClassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalAddStudentToClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
