import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassConnectionModalComponent } from './class-connection-modal.component';

describe('ClassConnectionModalComponent', () => {
  let component: ClassConnectionModalComponent;
  let fixture: ComponentFixture<ClassConnectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassConnectionModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassConnectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
