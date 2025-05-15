import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

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
  userEmail: string = '';
  userInitials: string = '';
  userRole: string = '';
  role: string = '';
  organizationName: string = '';
  
  // Theme state
  isDarkMode: boolean = false;
  themePreference: 'light' | 'dark' | 'system' = 'system';
  
  // Notification count (mock data - can be replaced with actual API integration)
  notificationCount: number = 3;

  // Dropdown control
  showNewDropdown: boolean = false;
  showCreateDropdown: boolean = false;
  showUserMenu: boolean = false;
  showMobileMenu: boolean = false;
    showThemeMenu: boolean = false;


  constructor(
    private authService: AuthService,
    private router: Router,
        private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
        this.setupThemeObservers();

  }


   /**
   * Setup theme observers to track theme state
   */
  setupThemeObservers(): void {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    this.themeService.themePreference$.subscribe(preference => {
      this.themePreference = preference;
    });
  }

  /**
   * Toggle between light and dark mode
   */
  toggleDarkMode(event?: Event): void {
    if (event) event.stopPropagation();
    this.themeService.toggleDarkMode();
  }
  
  /**
   * Set a specific theme
   */
  setTheme(theme: 'light' | 'dark' | 'system', event?: Event): void {
    if (event) event.stopPropagation();
    this.themeService.setTheme(theme);
    this.showThemeMenu = false;
  }
  
  /**
   * Toggle theme menu visibility
   */
  toggleThemeMenu(event: Event): void {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    
    // Close other menus
    this.showUserMenu = false;
    this.showNewDropdown = false;
    this.showCreateDropdown = false;
  }
  /**
   * Load user data including organization and role
   */
  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username || user.username || 'User';
      this.userEmail = user.email || 'user@example.com';
      this.userInitials = this.getInitials(this.username);
      this.organizationName = user.l_org_name || 'Micropro';

      // Set role for conditional rendering
      this.role = user.l_role_name?.toLowerCase() || 'user';

      // Format role for display
      this.userRole = this.formatRole(this.role);
    }
  }

  /**
   * Format role for display with proper capitalization and spacing
   */
  formatRoleDisplay(role: string): string {
    if (!role) return 'User';
    
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'hod':
        return 'Department Head';
      case 'employee':
        return 'Employee';
      case 'client':
        return 'Client';
      default:
        return this.formatRole(role);
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