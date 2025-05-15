import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterOutlet, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = true;
  
  ngOnInit() {
    // Initialize sidebar state based on screen size
    this.sidebarOpen = window.innerWidth >= 768;
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  handleSidebarToggle(isOpen: boolean): void {
    this.sidebarOpen = isOpen;
  }
}