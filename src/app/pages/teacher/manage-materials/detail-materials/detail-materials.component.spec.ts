import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailMaterialsComponent } from './detail-materials.component';

describe('DetailMaterialsComponent', () => {
  let component: DetailMaterialsComponent;
  let fixture: ComponentFixture<DetailMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailMaterialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
