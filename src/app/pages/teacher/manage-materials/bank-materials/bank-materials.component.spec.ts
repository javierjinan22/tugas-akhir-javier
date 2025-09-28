import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankMaterialsComponent } from './bank-materials.component';

describe('BankMaterialsComponent', () => {
  let component: BankMaterialsComponent;
  let fixture: ComponentFixture<BankMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BankMaterialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BankMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
