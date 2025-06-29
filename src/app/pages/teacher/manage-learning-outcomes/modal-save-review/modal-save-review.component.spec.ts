import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSaveReviewComponent } from './modal-save-review.component';

describe('ModalSaveReviewComponent', () => {
  let component: ModalSaveReviewComponent;
  let fixture: ComponentFixture<ModalSaveReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalSaveReviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalSaveReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
