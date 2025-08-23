import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmationDeleteMaterialsComponent } from './modal-confirmation-delete-materials.component';

describe('ModalConfirmationDeleteMaterialsComponent', () => {
  let component: ModalConfirmationDeleteMaterialsComponent;
  let fixture: ComponentFixture<ModalConfirmationDeleteMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalConfirmationDeleteMaterialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalConfirmationDeleteMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
