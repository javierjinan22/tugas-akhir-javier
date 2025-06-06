import { Component, OnInit } from '@angular/core';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-top',
  templateUrl: './navbar-top.component.html',
  styleUrls: ['./navbar-top.component.css']
})
export class NavbarTopComponent implements OnInit {
  faUserCircle = faUserCircle;

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  goToProfile() {
    // Arahkan ke halaman profil pengguna
    this.router.navigate(['/profil']);
  }

  logout() {
    // Tambahkan logika logout jika perlu
    localStorage.clear();
    this.router.navigate(['/']);
  }

}
