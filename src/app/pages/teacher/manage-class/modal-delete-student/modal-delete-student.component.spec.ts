import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeleteStudentComponent } from './modal-delete-student.component';

describe('ModalDeleteStudentComponent', () => {
  let component: ModalDeleteStudentComponent;
  let fixture: ComponentFixture<ModalDeleteStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalDeleteStudentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalDeleteStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
