import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalViewProfileComponent } from './modal-view-profile.component';

describe('ModalViewProfileComponent', () => {
  let component: ModalViewProfileComponent;
  let fixture: ComponentFixture<ModalViewProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalViewProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalViewProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
