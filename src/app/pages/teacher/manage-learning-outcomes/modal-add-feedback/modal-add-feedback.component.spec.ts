import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddFeedbackComponent } from './modal-add-feedback.component';

describe('ModalAddFeedbackComponent', () => {
  let component: ModalAddFeedbackComponent;
  let fixture: ComponentFixture<ModalAddFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalAddFeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalAddFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
