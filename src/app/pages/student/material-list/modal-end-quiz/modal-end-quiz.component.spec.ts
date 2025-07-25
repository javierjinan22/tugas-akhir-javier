import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEndQuizComponent } from './modal-end-quiz.component';

describe('ModalEndQuizComponent', () => {
  let component: ModalEndQuizComponent;
  let fixture: ComponentFixture<ModalEndQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalEndQuizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalEndQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
