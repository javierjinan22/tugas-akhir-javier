import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalStartQuizComponent } from './modal-start-quiz.component';

describe('ModalStartQuizComponent', () => {
  let component: ModalStartQuizComponent;
  let fixture: ComponentFixture<ModalStartQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalStartQuizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalStartQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
