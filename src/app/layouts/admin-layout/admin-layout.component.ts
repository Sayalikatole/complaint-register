import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
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