import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetailTopSchoolComponent } from './modal-detail-top-school.component';

describe('ModalDetailTopSchoolComponent', () => {
  let component: ModalDetailTopSchoolComponent;
  let fixture: ComponentFixture<ModalDetailTopSchoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalDetailTopSchoolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalDetailTopSchoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
