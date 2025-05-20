import { Component, OnInit, HostListener, Input, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { UserData } from '../../models/auth';



// Define interface for notification objects
interface Notification {
  id: string;
  type: 'urgent' | 'assignment' | 'status' | 'system' | 'comment';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  ticketId?: string;
  link?: string;
}



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

  @Input() sidebarOpen: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  // Notification properties
  notifications: Notification[] = [];
  showNotificationsDropdown: boolean = false;

  // Track active notification tab
  activeNotificationTab: 'all' | 'unread' | 'important' = 'all';
  currentUser: UserData | null = null;
  private destroy$ = new Subject<void>();


  private notificationSubscription: Subscription | null = null;
  private connectionSubscription: Subscription | null = null;
  isConnected = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private notificationService: NotificationService

  ) { }

  ngOnInit(): void {

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadUserData();
          this.setupThemeObservers();
          // Load notifications
          this.loadNotifications();

        }
      })

    // Get the current user ID from auth service
    // const userId = this.authService.getUserId();

    // Initialize WebSocket connection
    console.log('Current User:', this.currentUser?.account_id);
    if (this.currentUser)
      this.notificationService.initializeWebSocketConnection('1d18f44dc08e4790');

    // Subscribe to real-time notifications
    this.notificationSubscription = this.notificationService
      .getNotificationsRealtime()
      .subscribe((notification: Notification) => {
        // Add new notification to beginning of the array
        this.notifications.unshift(notification);

        // Update notification count
        if (!notification.read) {
          this.notificationCount++;
        }

        // Optionally play a sound
        // this.playNotificationSound();
      });

    // Monitor connection status more explicitly
    this.connectionSubscription = this.notificationService
      .getConnectionStatus()
      .subscribe(connected => {
        console.log('WebSocket connection status:', connected);
        this.isConnected = connected;

        if (connected) {
          console.log('WebSocket connected successfully! Waiting for notifications...');
        } else {
          console.error('WebSocket disconnected or failed to connect');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up subscriptions
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }

    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }

    // Disconnect from WebSocket server
    this.notificationService.disconnect();
  }


  // Play notification sound
  // playNotificationSound(): void {
  //   const audio = new Audio('assets/sounds/notification.mp3');
  //   audio.play();
  // }
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

    // Close notifications dropdown if open and clicked outside
    if (this.showNotificationsDropdown &&
      !target.closest('.notification-dropdown') &&
      !target.closest('button.relative')) {
      this.showNotificationsDropdown = false;
    }

    // Close menus when clicking outside their containers
    if (!target.closest('.user-menu-container') && !target.closest('.dropdown-container')) {
      this.showUserMenu = false;
      this.showNewDropdown = false;
      this.showCreateDropdown = false;
    }
  }


  /**
   * Set the active notification tab
   */
  setActiveTab(tab: 'all' | 'unread' | 'important'): void {
    this.activeNotificationTab = tab;
    // Prevent event propagation to avoid closing dropdown
    event?.stopPropagation();
  }

  /**
   * Get filtered notifications based on active tab
   */
  getFilteredNotifications(): Notification[] {
    if (!this.notifications) return [];

    switch (this.activeNotificationTab) {
      case 'unread':
        return this.notifications.filter(n => !n.read);
      case 'important':
        return this.notifications.filter(n => n.type === 'urgent');
      default:
        return this.notifications;
    }
  }

  /**
   * Count unread notifications
   */
  getUnreadCount(): number {
    return this.notifications ? this.notifications.filter(n => !n.read).length : 0;
  }

  /**
   * Count important notifications
   */
  getImportantCount(): number {
    return this.notifications ? this.notifications.filter(n => n.type === 'urgent').length : 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close user menu when clicking outside
    const target = event.target as HTMLElement;
    if (this.showUserMenu && !target.closest('.relative')) {
      this.showUserMenu = false;
    }
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }




  /**
   * Toggle notifications dropdown
   */
  toggleNotificationsDropdown(): void {
    // Close other dropdowns first
    this.showUserMenu = false;
    this.showNewDropdown = false;

    // Toggle notifications
    this.showNotificationsDropdown = !this.showNotificationsDropdown;

    // If opening, mark as seen (reduces counter but doesn't mark as read)
    if (this.showNotificationsDropdown) {
      this.notificationService.markAsSeen().subscribe();
    }
  }

  /**
   * Load notifications from service
   */
  loadNotifications(): void {
    // Temporary mock data until you connect to your API
    this.notifications = [
      {
        id: '1',
        type: 'urgent',
        title: 'Urgent Complaint Reported',
        message: 'A new urgent complaint has been reported in the IT department.',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        ticketId: 'CMP-1001'
      },
      {
        id: '2',
        type: 'assignment',
        title: 'Complaint Assigned',
        message: 'Complaint #CMP-982 has been assigned to you by the department head.',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        ticketId: 'CMP-982'
      },
      {
        id: '3',
        type: 'status',
        title: 'Status Update',
        message: 'Complaint #CMP-971 status has changed from "In Progress" to "Resolved".',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        ticketId: 'CMP-971'
      }
    ];

    this.notificationService.getNotifications().subscribe(
      (data) => {
        this.notifications = data;
        this.notificationCount = data.filter(n => !n.read).length;
      },
      (error) => {
        console.error('Error loading notifications', error);
      }
    );
  }
  // }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(
      () => {
        this.notifications.forEach(n => n.read = true);
        this.notificationCount = 0;
      },
      (error) => {
        console.error('Error marking notifications as read', error);
      }
    );

    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notificationService.clearAll().subscribe(
      () => {
        this.notifications = [];
        this.notificationCount = 0;
      },
      (error) => {
        console.error('Error clearing notifications', error);
      }
    );
  }

  /**
  * Mark a specific notification as read
  */
  markAsRead(notification: Notification, event?: MouseEvent): void {
    // Prevent event bubbling to parent (which would trigger handleNotificationClick)
    if (event) {
      event.stopPropagation();
    }

    // Update local state
    notification.read = true;
    this.notificationCount = this.getUnreadCount();

    // In production, you would call your service:
    // this.notificationService.markAsRead(notification.id).subscribe();
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification): void {
    // Mark as read
    this.notificationService.markAsRead(notification.id).subscribe(
      () => {
        // Update local state
        notification.read = true;
        this.notificationCount = this.notifications.filter(n => !n.read).length;

        // Navigate to related page if link exists
        if (notification.link) {
          this.router.navigateByUrl(notification.link);
          this.showNotificationsDropdown = false;
        } else if (notification.ticketId) {
          // Navigate to the specific complaint/ticket
          this.router.navigate(['/', this.role, 'complaints', notification.ticketId]);
          this.showNotificationsDropdown = false;
        }
      },
      (error) => {
        console.error('Error marking notification as read', error);
      }
    );
  }

  /**
   * Format timestamp as relative time (e.g. "2 hours ago")
   */
  formatTimeAgo(date: Date): string {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      // Format as date for older notifications
      return new Date(date).toLocaleDateString();
    }
  }

}