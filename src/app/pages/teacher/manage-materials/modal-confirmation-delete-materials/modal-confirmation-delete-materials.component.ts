
import { Component, OnInit } from '@angular/core';
import { faExclamation, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-confirmation-delete-materials',
  templateUrl: './modal-confirmation-delete-materials.component.html',
  styleUrls: ['./modal-confirmation-delete-materials.component.css']
})
export class ModalConfirmationDeleteMaterialsComponent implements OnInit {

  // FontAwesome icons
    faExclamation = faExclamation;
    faTrash = faTrash;
  
    // Data passed from parent component
    materialData: any;
    
    // Event emitters
    public onClose: Subject<{ action: string }> = new Subject();
    
    constructor(
      private bsModalRef: BsModalRef
    ) { }
  
    ngOnInit(): void {
    }
  
    // Delete material permanently
    deleteMaterial(): void {
      this.onClose.next({ action: 'delete' });
      this.bsModalRef.hide();
    }
  
    // Cancel operation
    cancelAction(): void {
      this.onClose.next({ action: 'cancel' });
      this.bsModalRef.hide();
    }

}
