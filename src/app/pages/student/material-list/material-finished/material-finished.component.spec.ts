import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialFinishedComponent } from './material-finished.component';

describe('MaterialFinishedComponent', () => {
  let component: MaterialFinishedComponent;
  let fixture: ComponentFixture<MaterialFinishedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaterialFinishedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialFinishedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
