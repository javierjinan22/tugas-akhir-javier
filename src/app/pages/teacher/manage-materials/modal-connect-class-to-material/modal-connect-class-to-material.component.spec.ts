import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConnectClassToMaterialComponent } from './modal-connect-class-to-material.component';

describe('ModalConnectClassToMaterialComponent', () => {
  let component: ModalConnectClassToMaterialComponent;
  let fixture: ComponentFixture<ModalConnectClassToMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalConnectClassToMaterialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalConnectClassToMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
