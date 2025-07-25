import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRestoreClassComponent } from './modal-restore-class.component';

describe('ModalRestoreClassComponent', () => {
  let component: ModalRestoreClassComponent;
  let fixture: ComponentFixture<ModalRestoreClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalRestoreClassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalRestoreClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
