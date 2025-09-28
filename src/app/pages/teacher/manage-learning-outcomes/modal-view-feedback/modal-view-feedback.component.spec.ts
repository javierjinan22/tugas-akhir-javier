import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalViewFeedbackComponent } from './modal-view-feedback.component';

describe('ModalViewFeedbackComponent', () => {
  let component: ModalViewFeedbackComponent;
  let fixture: ComponentFixture<ModalViewFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalViewFeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalViewFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
