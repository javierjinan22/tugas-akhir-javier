import { Component, OnInit } from '@angular/core';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ModalViewProfileComponent } from 'src/app/features/modal-view-profile/modal-view-profile.component';

@Component({
  selector: 'app-navbar-top',
  templateUrl: './navbar-top.component.html',
  styleUrls: ['./navbar-top.component.css']
})
export class NavbarTopComponent implements OnInit {
  faUserCircle = faUserCircle;
  bsModalRef: BsModalRef | undefined;

  constructor(
    private router: Router,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
  }

  goToProfile() {
    this.bsModalRef = this.modalService.show(ModalViewProfileComponent, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
  }

  logout() {
    // Tambahkan logika logout jika perlu
    localStorage.clear();
    this.router.navigate(['/']);
  }

}
