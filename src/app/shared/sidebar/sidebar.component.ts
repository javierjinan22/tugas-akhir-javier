import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Input() role: 'guru' | 'siswa' = 'guru';
  collapsed = false;

  constructor() { }

  ngOnInit(): void {
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

}
