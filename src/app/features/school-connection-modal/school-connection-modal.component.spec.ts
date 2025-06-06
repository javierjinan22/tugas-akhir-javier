import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolConnectionModalComponent } from './school-connection-modal.component';

describe('SchoolConnectionModalComponent', () => {
  let component: SchoolConnectionModalComponent;
  let fixture: ComponentFixture<SchoolConnectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SchoolConnectionModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolConnectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
