import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrayWrapperComponent } from './array-wrapper.component';

describe('ArrayWrapperComponent', () => {
  let component: ArrayWrapperComponent;
  let fixture: ComponentFixture<ArrayWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArrayWrapperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrayWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
