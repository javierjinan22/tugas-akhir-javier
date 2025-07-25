import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialStudiedComponent } from './material-studied.component';

describe('MaterialStudiedComponent', () => {
  let component: MaterialStudiedComponent;
  let fixture: ComponentFixture<MaterialStudiedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaterialStudiedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialStudiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
