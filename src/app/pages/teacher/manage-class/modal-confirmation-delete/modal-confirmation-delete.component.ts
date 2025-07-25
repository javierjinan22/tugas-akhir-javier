import { Component, OnInit } from '@angular/core';
import { faExclamation, faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-confirmation-delete',
  templateUrl: './modal-confirmation-delete.component.html',
  styleUrls: ['./modal-confirmation-delete.component.css']
})
export class ModalConfirmationDeleteComponent implements OnInit {
  // FontAwesome icons
  faExclamation = faExclamation;
  faArchive = faArchive;
  faTrash = faTrash;

  // Data passed from parent component
  classData: any;
  
  // Event emitters
  public onClose: Subject<{ action: string, permanent?: boolean }> = new Subject();
  
  constructor(
    private bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

  // Archive class - soft delete
  archiveClass(): void {
    this.onClose.next({ action: 'delete', permanent: false });
    this.bsModalRef.hide();
  }

  // Permanently delete class
  deleteClassPermanently(): void {
    this.onClose.next({ action: 'delete', permanent: true });
    this.bsModalRef.hide();
  }

  // Cancel operation
  cancelAction(): void {
    this.onClose.next({ action: 'cancel' });
    this.bsModalRef.hide();
  }
}
