import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectRoleModalComponent } from './select-role-modal.component';

describe('SelectRoleModalComponent', () => {
  let component: SelectRoleModalComponent;
  let fixture: ComponentFixture<SelectRoleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectRoleModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectRoleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
