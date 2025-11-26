import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Input() role: 'guru' | 'siswa' = 'guru';
  @Output() sidebarToggled = new EventEmitter<boolean>();
  
  collapsed = true;
  isQuizActive = false;
  isMobile = false;
  private toggleListener: any;

  constructor(public router: Router) { }

  ngOnInit(): void {
    this.checkMobileState();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navigationEvent = event as NavigationEnd;
      
      if (this.role === 'siswa') {
        this.isQuizActive = navigationEvent.url.includes('/kuis/kerjakan');
      } else {
        this.isQuizActive = false;
      }
    });

    this.toggleListener = () => {
      if (this.isMobile) {
        this.collapsed = !this.collapsed;
      }
    };
    
    document.addEventListener('toggleMobileSidebar', this.toggleListener);
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('mobile-sidebar-open');
      document.removeEventListener('toggleMobileSidebar', this.toggleListener);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
    }
  }

  private checkMobileState(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 768;
      this.collapsed = this.isMobile; // ✅ CRITICAL: Always start collapsed on mobile
    }
  }

  handleResize(): void {
    this.checkMobileState();
    
    if (!this.isMobile) {
      // ✅ CRITICAL: Clean up body class when resizing to desktop
      if (typeof document !== 'undefined') {
        document.body.classList.remove('mobile-sidebar-open');
      }
    }
  }

  getToggleIcon(): string {
    return 'fa-bars'; // ✅ SIMPLIFIED: Always hamburger for toggle
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.collapsed = !this.collapsed;
      
      // ✅ CRITICAL: Manage body class properly
      if (typeof document !== 'undefined') {
        if (!this.collapsed) {
          document.body.classList.add('mobile-sidebar-open');
        } else {
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    } else {
      // Desktop logic
      this.collapsed = !this.collapsed;
    }
    
    this.sidebarToggled.emit(this.collapsed);
  }

  closeSidebar(): void {
    this.collapsed = true;
    
    // ✅ CRITICAL: Always remove body class when closing
    if (typeof document !== 'undefined') {
      document.body.classList.remove('mobile-sidebar-open');
    }
    
    this.sidebarToggled.emit(this.collapsed);
  }

  navigateWithQuizCheck(route: string): void {
    if (this.isQuizActive) {
      return;
    }

    this.router.navigate([`/siswa/${route}`]);
    
    if (this.isMobile) {
      // ✅ CRITICAL: Auto-close sidebar after navigation
      setTimeout(() => {
        this.closeSidebar();
      }, 300);
    }
  }

  shouldShowBackdrop(): boolean {
    return !this.collapsed && this.isMobile;
  }
}