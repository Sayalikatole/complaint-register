import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  // User information
  username: string = '';
  userInitials: string = '';
  userRole: string = '';
  role: string = '';
  organizationName: string = '';

  // Dropdown control
  showNewDropdown: boolean = false;
  showCreateDropdown: boolean = false;
  showUserMenu: boolean = false;
  showMobileMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  /**
   * Load user data including organization and role
   */
  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username || user.username || 'User';
      this.userInitials = this.getInitials(this.username);
      this.organizationName = user.l_org_name || 'Micropro';

      // Set role for conditional rendering
      this.role = user.l_role_name?.toLowerCase() || 'user';

      // Format role for display
      this.userRole = this.formatRole(this.role);
    }
  }

  /**
   * Generate user initials from name
   */
  getInitials(name: string): string {
    if (!name) return 'U';

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Format role for user display
   */
  formatRole(role: string): string {
    if (!role) return 'User';

    // Convert camelCase or snake_case to Title Case with spaces
    return role
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Toggle New dropdown for admin
   */
  toggleNewDropdown(): void {
    this.showNewDropdown = !this.showNewDropdown;
    // Close other menus when opening this one
    if (this.showNewDropdown) {
      this.showUserMenu = false;
      this.showCreateDropdown = false;
    }
  }

  /**
   * Toggle Create dropdown for non-admin users
   */
  toggleCreateDropdown(): void {
    this.showCreateDropdown = !this.showCreateDropdown;
    // Close other menus when opening this one
    if (this.showCreateDropdown) {
      this.showUserMenu = false;
      this.showNewDropdown = false;
    }
  }

  /**
   * Toggle user profile menu
   */
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    // Close other menus when opening this one
    if (this.showUserMenu) {
      this.showNewDropdown = false;
      this.showCreateDropdown = false;
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    // Close dropdowns when toggling mobile menu
    this.showNewDropdown = false;
    this.showUserMenu = false;
    this.showCreateDropdown = false;
  }

  /**
   * Open create complaint form (for non-admin users) - deprecated
   * Now replaced by dropdown menu
   */
  openCreateComplaint(): void {
    console.log(this.role);
    if (this.role === 'client') {
      this.router.navigate(['/client/create-complaints']);
    }
    if (this.role === 'hod') {
      this.router.navigate(['/hod/create-complaints']);
    }
    if (this.role === 'employee') {
      this.router.navigate(['/employee/create-complaints']);
    }
  }

  /**
   * Close menus when clicking outside
   */
  @HostListener('document:click', ['$event'])
  closeMenus(event: Event): void {
    const target = event.target as HTMLElement;

    // Don't close if clicked on toggle buttons
    if (target.closest('.dropdown-toggle')) return;

    // Close menus when clicking outside their containers
    if (!target.closest('.user-menu-container') && !target.closest('.dropdown-container')) {
      this.showUserMenu = false;
      this.showNewDropdown = false;
      this.showCreateDropdown = false;
    }
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}