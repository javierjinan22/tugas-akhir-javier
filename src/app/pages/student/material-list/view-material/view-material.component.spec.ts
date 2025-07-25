import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMaterialComponent } from './view-material.component';

describe('ViewMaterialComponent', () => {
  let component: ViewMaterialComponent;
  let fixture: ComponentFixture<ViewMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewMaterialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
