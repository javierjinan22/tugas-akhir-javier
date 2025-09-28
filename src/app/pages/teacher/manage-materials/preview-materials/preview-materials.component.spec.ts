import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewMaterialsComponent } from './preview-materials.component';

describe('PreviewMaterialsComponent', () => {
  let component: PreviewMaterialsComponent;
  let fixture: ComponentFixture<PreviewMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreviewMaterialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
