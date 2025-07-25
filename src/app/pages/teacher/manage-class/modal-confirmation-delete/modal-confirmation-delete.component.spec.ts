import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmationDeleteComponent } from './modal-confirmation-delete.component';

describe('ModalConfirmationDeleteComponent', () => {
  let component: ModalConfirmationDeleteComponent;
  let fixture: ComponentFixture<ModalConfirmationDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalConfirmationDeleteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalConfirmationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
