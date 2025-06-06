import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { faGraduationCap, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import { TeacherRegistrationModalComponent } from '../teacher-registration-modal/teacher-registration-modal.component';
import { StudentRegistrationModalComponent } from '../student-registration-modal/student-registration-modal.component';


@Component({
  selector: 'app-select-role-modal',
  templateUrl: './select-role-modal.component.html',
  styleUrls: ['./select-role-modal.component.css']
})
export class SelectRoleModalComponent implements OnInit {

  faGraduationCap = faGraduationCap;
  faChalkboardTeacher = faChalkboardTeacher;

  constructor(
    public activeModal: BsModalRef,
    public modalService: BsModalService
  ) { }

  ngOnInit(): void {
  }

  onRoleSelected(role: string) {
    console.log('Role selected:', role);
    // Close modal
    this.activeModal.hide();

    if (role === 'guru') {
      this.modalService.show(TeacherRegistrationModalComponent, {
        class: 'modal-dialog-centered'
      });
    } else if (role === 'siswa') {
      this.modalService.show(StudentRegistrationModalComponent, {
        class: 'modal-dialog-centered'
      });
    }
  }

}
