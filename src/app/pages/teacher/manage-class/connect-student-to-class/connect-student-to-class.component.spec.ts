import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectStudentToClassComponent } from './connect-student-to-class.component';

describe('ConnectStudentToClassComponent', () => {
  let component: ConnectStudentToClassComponent;
  let fixture: ComponentFixture<ConnectStudentToClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectStudentToClassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectStudentToClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
