import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputNpsnModalComponent } from './input-npsn-modal.component';

describe('InputNpsnModalComponent', () => {
  let component: InputNpsnModalComponent;
  let fixture: ComponentFixture<InputNpsnModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputNpsnModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputNpsnModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
