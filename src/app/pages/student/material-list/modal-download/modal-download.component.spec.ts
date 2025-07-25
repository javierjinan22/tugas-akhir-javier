import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDownloadComponent } from './modal-download.component';

describe('ModalDownloadComponent', () => {
  let component: ModalDownloadComponent;
  let fixture: ComponentFixture<ModalDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalDownloadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
