import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewClassComponent } from './create-new-class.component';

describe('CreateNewClassComponent', () => {
  let component: CreateNewClassComponent;
  let fixture: ComponentFixture<CreateNewClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewClassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
