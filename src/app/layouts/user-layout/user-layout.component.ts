import { Component } from '@angular/core';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent {
  sidebarOpen: boolean = true;

  constructor() { }

  ngOnInit(): void {
    // Check if sidebar state is saved in localStorage
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      this.sidebarOpen = JSON.parse(savedState);
    } else {
      // Default to open on larger screens, closed on mobile
      this.sidebarOpen = window.innerWidth > 768;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    localStorage.setItem('sidebarOpen', JSON.stringify(this.sidebarOpen));
  }

  handleSidebarToggle(isOpen: boolean): void {
    this.sidebarOpen = isOpen;
    localStorage.setItem('sidebarOpen', JSON.stringify(this.sidebarOpen));
  }
}
