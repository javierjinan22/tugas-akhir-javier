import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassArchivedComponent } from './class-archived.component';

describe('ClassArchivedComponent', () => {
  let component: ClassArchivedComponent;
  let fixture: ComponentFixture<ClassArchivedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassArchivedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassArchivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
