import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  // Sidebar state
  @Input() sidebarOpen = true;
  @Output() sidebarToggled = new EventEmitter<boolean>();
  
  // User information
  username: string = '';
  userEmail: string = '';
  userInitials: string = '';
  role: string = '';
  
  // Notification counts
  assignedCount: number = 0;
  urgentCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set sidebar state based on screen size
    this.sidebarOpen = window.innerWidth >= 768;
    
    // Load user data
    this.loadUserData();
    
    // Load counts (these would normally come from your services)
    this.loadAssignedComplaints();
    this.loadUrgentComplaints();
    
    // Apply proper body padding based on sidebar state
    this.adjustLayoutPadding();
  }

  /**
   * Toggle sidebar state
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggled.emit(this.sidebarOpen);
    this.adjustLayoutPadding();
  }

  /**
   * Adjust body padding based on sidebar visibility
   */
  adjustLayoutPadding(): void {
    // This is an optional method to adjust layout if needed
    // You may need to implement this differently based on your layout structure
    if (window.innerWidth >= 768) {
      document.body.style.paddingLeft = this.sidebarOpen ? '16rem' : '0';
    } else {
      document.body.style.paddingLeft = '0';
    }
  }

  /**
   * Load user data from auth service
   */
  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username || 'User';
      this.userEmail = user.email || 'user@example.com';
      this.userInitials = this.getInitials(this.username);
      this.role = user.l_role_name?.toLowerCase() || 'user';
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
   * Format role for display with proper capitalization
   */
  formatRoleDisplay(role: string): string {
    if (!role) return 'User';
    
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'hod':
        return 'Dept. Head';
      case 'employee':
        return 'Employee';
      case 'client':
        return 'Client';
      default:
        return this.formatRole(role);
    }
  }

  /**
   * Format role for user display with proper capitalization
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
   * Open feedback form (modal or navigate to create page)
   */
  openFeedbackForm(): void {
    // Either open a modal or navigate to create complaint page
    this.router.navigate(['/', this.role, 'create-complaint']);
  }

  /**
   * Open suggestion form
   */
  openSuggestionForm(): void {
    // Navigate to create suggestion page
    this.router.navigate(['/', this.role, 'create-suggestion']);
  }

  /**
   * Load assigned complaints for count badge
   */
  loadAssignedComplaints(): void {
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.assignedCount = Math.floor(Math.random() * 5); // Random count for demo
    }, 1000);
  }

  /**
   * Load urgent complaints for count badge
   */
  loadUrgentComplaints(): void {
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.urgentCount = Math.floor(Math.random() * 3); // Random count for demo
    }, 1000);
  }

  /**
   * Respond to window resize events
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Auto-show sidebar on larger screens, hide on smaller screens
    if (window.innerWidth >= 768) {
      this.sidebarOpen = true;
    } else {
      this.sidebarOpen = false;
    }
    this.sidebarToggled.emit(this.sidebarOpen);
    this.adjustLayoutPadding();
  }
}