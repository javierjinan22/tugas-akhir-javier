import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-material-list',
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.css']
})
export class MaterialListComponent implements OnInit, AfterViewInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Handle fragment navigation from dashboard
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.activateTab(fragment);
      }
    });
  }

  private activateTab(fragment: string): void {
    // Activate the appropriate tab based on fragment
    setTimeout(() => {
      const tabElement = document.querySelector(`#${fragment}-tab`) as HTMLElement;
      const contentElement = document.querySelector(`#${fragment}`) as HTMLElement;
      
      if (tabElement && contentElement) {
        // Remove active class from all tabs
        document.querySelectorAll('.nav-link').forEach(tab => {
          tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('show', 'active');
        });
        
        // Add active class to target tab
        tabElement.classList.add('active');
        contentElement.classList.add('show', 'active');
      }
    }, 100);
  }
}
