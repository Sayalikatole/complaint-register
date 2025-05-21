// import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
// import { Router } from '@angular/router';
// import { AuthService } from '../../services/auth.service';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './sidebar.component.html',
//   styleUrls: ['./sidebar.component.scss']
// })
// export class SidebarComponent implements OnInit {
//   // Sidebar state
//   @Input() sidebarOpen = true;
//   @Output() sidebarToggled = new EventEmitter<boolean>();

//   // User information
//   username: string = '';
//   userEmail: string = '';
//   userInitials: string = '';
//   role: string = '';

//   // Notification counts
//   assignedCount: number = 0;
//   urgentCount: number = 0;

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     // Set sidebar state based on screen size
//     this.sidebarOpen = window.innerWidth >= 768;

//     // Load user data
//     this.loadUserData();

//     // Load counts (these would normally come from your services)
//     this.loadAssignedComplaints();
//     this.loadUrgentComplaints();

//     // Apply proper body padding based on sidebar state
//     this.adjustLayoutPadding();
//   }

//   /**
//    * Toggle sidebar state
//    */
//   toggleSidebar(): void {
//     this.sidebarOpen = !this.sidebarOpen;
//     this.sidebarToggled.emit(this.sidebarOpen);
//     this.adjustLayoutPadding();
//   }

//   /**
//    * Adjust body padding based on sidebar visibility
//    */
//   adjustLayoutPadding(): void {
//     // This is an optional method to adjust layout if needed
//     // You may need to implement this differently based on your layout structure
//     if (window.innerWidth >= 768) {
//       document.body.style.paddingLeft = this.sidebarOpen ? '16rem' : '0';
//     } else {
//       document.body.style.paddingLeft = '0';
//     }
//   }

//   /**
//    * Load user data from auth service
//    */
//   loadUserData(): void {
//     const user = this.authService.getCurrentUser();
//     if (user) {
//       this.username = user.username || 'User';
//       this.userEmail = user.email || 'user@example.com';
//       this.userInitials = this.getInitials(this.username);
//       this.role = user.l_role_name?.toLowerCase() || 'user';
//     }
//   }

//   /**
//    * Generate user initials from name
//    */
//   getInitials(name: string): string {
//     if (!name) return 'U';

//     const nameParts = name.split(' ');
//     if (nameParts.length >= 2) {
//       return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
//     }
//     return name.substring(0, 2).toUpperCase();
//   }

//   /**
//    * Format role for display with proper capitalization
//    */
//   formatRoleDisplay(role: string): string {
//     if (!role) return 'User';

//     switch (role.toLowerCase()) {
//       case 'admin':
//         return 'Administrator';
//       case 'hod':
//         return 'Dept. Head';
//       case 'employee':
//         return 'Employee';
//       case 'client':
//         return 'Client';
//       default:
//         return this.formatRole(role);
//     }
//   }

//   /**
//    * Format role for user display with proper capitalization
//    */
//   formatRole(role: string): string {
//     if (!role) return 'User';

//     // Convert camelCase or snake_case to Title Case with spaces
//     return role
//       .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
//       .replace(/_/g, ' ') // Replace underscores with spaces
//       .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
//       .trim();
//   }

//   /**
//    * Open feedback form (modal or navigate to create page)
//    */
//   openFeedbackForm(): void {
//     // Either open a modal or navigate to create complaint page
//     this.router.navigate(['/', this.role, 'create-complaint']);
//   }

//   /**
//    * Open suggestion form
//    */
//   openSuggestionForm(): void {
//     // Navigate to create suggestion page
//     this.router.navigate(['/', this.role, 'create-suggestion']);
//   }

//   /**
//    * Load assigned complaints for count badge
//    */
//   loadAssignedComplaints(): void {
//     // Mock data - replace with actual API call
//     setTimeout(() => {
//       this.assignedCount = Math.floor(Math.random() * 5); // Random count for demo
//     }, 1000);
//   }

//   /**
//    * Load urgent complaints for count badge
//    */
//   loadUrgentComplaints(): void {
//     // Mock data - replace with actual API call
//     setTimeout(() => {
//       this.urgentCount = Math.floor(Math.random() * 3); // Random count for demo
//     }, 1000);
//   }

//   /**
//    * Respond to window resize events
//    */
//   @HostListener('window:resize', ['$event'])
//   onResize(event: any): void {
//     // Auto-show sidebar on larger screens, hide on smaller screens
//     if (window.innerWidth >= 768) {
//       this.sidebarOpen = true;
//     } else {
//       this.sidebarOpen = false;
//     }
//     this.sidebarToggled.emit(this.sidebarOpen);
//     this.adjustLayoutPadding();
//   }
// }






// import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { AuthService } from '../../services/auth.service';

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './sidebar.component.html',
//   styleUrls: ['./sidebar.component.scss']
// })
// export class SidebarComponent implements OnInit {
//   @Input() sidebarOpen: boolean = true;
//   @Output() sidebarToggled = new EventEmitter<boolean>();

//   constructor(private authService: AuthService) { }

//   ngOnInit(): void {
//     // Initialization code if needed
//   }

//   toggleSidebar(): void {
//     this.sidebarOpen = !this.sidebarOpen;
//     this.sidebarToggled.emit(this.sidebarOpen);
//   }

//   getUserName(): string {
//     const user = this.authService.getCurrentUser();
//     return user?.username || 'User';
//   }

//   getUserInitials(): string {
//     const name = this.getUserName();
//     const nameParts = name.split(' ');
//     if (nameParts.length > 1) {
//       return (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '');
//     } else {
//       return name.substring(0, 2);
//     }
//   }

//   getUserRole(): string {
//     const user = this.authService.getCurrentUser();
//     return user?.role || 'User';
//   }

//   isAdmin(): boolean {
//     const user = this.authService.getCurrentUser();
//     return user?.role === 'admin' || user?.role === 'hod';
//   }
// }


















import { Component, EventEmitter, Input, OnInit, Output, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ComplaintPriority } from '../../enums/complaint_priority';
import { CategoryService } from '../../services/category.service';
import { Cl_getUserComplaintPayload, ComplaintService } from '../../services/complaint.service';
import { TagsService } from '../../services/tags.service';
import { UserData } from '../../models/auth';
import { Complaint } from '../../models/complaint';
import { Category } from '../../models/category';
import { Tags } from '../../models/tags';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
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
  createdCount: number =0;

  // Responsive detection
  isDesktop: boolean = true;

  // Current user
  currentUser: UserData | null = null;

  // Data collections
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  categories: Category[] = [];
  tags: Tags[] = [];

  // Status tracking
  isLoading: boolean = false;
  errorMessage: string | null = null;

  // Filters
  searchTerm: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  selectedTag: string = 'all';
  showAnonymousOnly: boolean = false;

  // Destroy subject for unsubscribing
  private destroy$ = new Subject<void>();
  

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private tagService: TagsService
  ) { }

  ngOnInit(): void {
    // Check user auth status
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Set role
          this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';

          // Load data
          this.loadComplaints();
          this.loadCategories();
          this.loadTags();
        }
      });

    // Detect device type
    this.checkScreenSize();

    // Load user data
    this.loadUserData();

    // Load counts
    this.loadAssignedComplaints();
    this.loadUrgentComplaints();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load complaints from the service
   */
  loadComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const complaintData: Cl_getUserComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId
    };

    this.complaintService.getUserComplaints(complaintData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaints = data;
          this.filteredComplaints = [...this.complaints];
          this.updateCounters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.errorMessage = 'Failed to load complaints. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Update counters for assigned and urgent complaints
   */
  updateCounters(): void {
    if (!this.currentUser) return;

    // Count assigned complaints
    this.assignedCount = this.complaints.filter(
      complaint => complaint.assigned_to === this.currentUser?.userId
    ).length;

    // Count assigned complaints
    this.createdCount = this.complaints.filter(
      complaint => complaint.created_by === this.currentUser?.userId
    ).length;


    // Count urgent complaints
    this.urgentCount = this.complaints.filter(
      complaint => complaint.priority.toUpperCase() === ComplaintPriority.HIGH
    ).length;
  }

  /**
   * Load categories from the service
   */
  loadCategories(): void {
    if (!this.currentUser) return;

    const payload = {
      org_id: parseInt(this.currentUser.organizationId),
      opr_id: parseInt(this.currentUser.operatingUnitId),
      id: "" // Empty to get all categories
    };

    this.categoryService.getCategoriesByDepartment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.categories = data;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  /**
   * Load tags from the service
   */
  loadTags(): void {
    if (!this.currentUser) return;

    const payload = {
      org_id: parseInt(this.currentUser.organizationId),
      opr_id: parseInt(this.currentUser.operatingUnitId),
      id: "" // Empty to get all tags
    };

    this.tagService.getTagsByCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tags = data;
        },
        error: (error) => {
          console.error('Error loading tags:', error);
        }
      });
  }

  /**
   * Apply filters to complaints
   */
  applyFilters(): void {
    let filtered = this.complaints;

    // Apply each filter sequentially
    if (this.searchTerm.trim()) {
      const searchTermLower = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(complaint =>
        complaint.subject.toLowerCase().includes(searchTermLower) ||
        complaint.description.toLowerCase().includes(searchTermLower) ||
        complaint.complaint_id.toLowerCase().includes(searchTermLower)
      );
    }

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(complaint =>
        complaint.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(complaint =>
        complaint.category_id === this.selectedCategory
      );
    }

    // if (this.selectedTag !== 'all') {
    //   filtered = filtered.filter(complaint => {
    //     // Handle both array and string formats of tags
    //     if (Array.isArray(complaint.tags)) {
    //       return complaint.tags.includes(this.selectedTag);
    //     } else if (typeof complaint.tag_id === 'string' && complaint.tag_id) {
    //       return complaint.tag_id.split(',').includes(this.selectedTag);
    //     }
    //     return false;
    //   });
    // }

    if (this.showAnonymousOnly) {
      filtered = filtered.filter(complaint =>
        complaint.is_anonymous === 'YES'
      );
    }

    this.filteredComplaints = filtered;
  }

  /**
   * Check if the current screen size is desktop
   */
  private checkScreenSize(): void {
    this.isDesktop = window.innerWidth >= 768;

    // If mobile, ensure sidebar is closed by default
    if (!this.isDesktop) {
      this.sidebarOpen = false;
    }
  }

  /**
   * Toggle sidebar state
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggled.emit(this.sidebarOpen);

    // Save preference to localStorage
    localStorage.setItem('sidebarOpen', JSON.stringify(this.sidebarOpen));
  }

  /**
   * Apply filters based on route parameter
   */
  applyFilterFromRoute(filterType: string): void {
    // Reset other filters first
    this.selectedStatus = 'all';
    this.selectedCategory = 'all';
    this.selectedTag = 'all';
    this.searchTerm = '';
    this.showAnonymousOnly = false;

    switch (filterType) {
      case 'assigned':
        // Apply filter for complaints assigned to current user
        this.filterComplaintsByAssignee();
        break;
      case 'created':
        // Apply filter for complaints created by current user
        this.filterComplaintsByCreator();
        break;
      case 'urgent':
        // Apply filter for high priority complaints
        this.filterComplaintsByPriority();
        break;
    }
  }

  /**
   * Filter complaints assigned to the current user
   */
  filterComplaintsByAssignee(): void {
    if (!this.currentUser) return;

    this.filteredComplaints = this.complaints.filter(
      complaint => complaint.assigned_to === this.currentUser?.userId
    );
  }

  /**
   * Filter complaints created by the current user
   */
  filterComplaintsByCreator(): void {
    if (!this.currentUser) return;

    this.filteredComplaints = this.complaints.filter(
      complaint => complaint.created_by === this.currentUser?.userId
    );
  }

  /**
   * Filter high priority (urgent) complaints
   */
  filterComplaintsByPriority(): void {
    this.filteredComplaints = this.complaints.filter(
      complaint => complaint.priority.toUpperCase() === ComplaintPriority.HIGH
    );
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
   * Load assigned complaints for count badge - this will be replaced by actual data
   */
  loadAssignedComplaints(): void {
    if (this.currentUser && this.complaints.length > 0) {
      // If we already have complaints data, calculate directly
      this.assignedCount = this.complaints.filter(
        complaint => complaint.assigned_to === this.currentUser?.userId
      ).length;
    } else {
      // Fallback to mock data until real data is loaded
      setTimeout(() => {
        if (!this.complaints.length) {
          this.assignedCount = Math.floor(Math.random() * 5) + 1;
        }
      }, 1000);
    }
  }


  /**
   * Load assigned complaints for count badge - this will be replaced by actual data
   */
  loadCreatedComplaints(): void {
    if (this.currentUser && this.complaints.length > 0) {
      // If we already have complaints data, calculate directly
      this.createdCount = this.complaints.filter(
        complaint => complaint.created_by === this.currentUser?.userId
      ).length;
    } else {
      // Fallback to mock data until real data is loaded
      setTimeout(() => {
        if (!this.complaints.length) {
          this.createdCount = Math.floor(Math.random() * 5) + 1;
        }
      }, 1000);
    }
  }


  /**
   * Load urgent complaints for count badge - this will be replaced by actual data
   */
  loadUrgentComplaints(): void {
    if (this.complaints.length > 0) {
      // If we already have complaints data, calculate directly
      this.urgentCount = this.complaints.filter(
        complaint => complaint.priority.toUpperCase() === ComplaintPriority.HIGH
      ).length;
    } else {
      // Fallback to mock data until real data is loaded
      setTimeout(() => {
        if (!this.complaints.length) {
          this.urgentCount = Math.floor(Math.random() * 3);
        }
      }, 1000);
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
   * Navigate to complaints list with pre-applied filters
   */
  navigateToFilteredComplaints(filterType: string): void {
    // Close sidebar on mobile when navigating
    if (!this.isDesktop) {
      this.sidebarOpen = false;
      this.sidebarToggled.emit(this.sidebarOpen);
    }

    // Navigate with appropriate query parameters based on filter type
    switch (filterType) {
      case 'assigned':
        this.router.navigate(['/', this.role, 'complaints'], {
          queryParams: { filter: 'assigned' }
        });
        break;
      case 'created':
        this.router.navigate(['/', this.role, 'complaints'], {
          queryParams: { filter: 'created' }
        });
        break;
      case 'urgent':
        this.router.navigate(['/', this.role, 'complaints'], {
          queryParams: { filter: 'urgent' }
        });
        break;
      default:
        this.router.navigate(['/', this.role, 'complaints']);
        break;
    }
  }

  /**
   * Open new complaint form
   */
  openFeedbackForm(): void {
    this.router.navigate(['/', this.role, 'new-complaint']);
  }

  /**
   * Open new suggestion form
   */
  openSuggestionForm(): void {
    this.router.navigate(['/', this.role, 'new-suggestion']);
  }

  /**
   * Check if a route is active (for applying custom styles)
   */
  isActiveRoute(path: string[]): boolean {
    const urlTree = this.router.createUrlTree(path);
    return this.router.isActive(urlTree, {
      paths: 'exact',
      queryParams: 'ignored', // Changed to 'ignored' to match base path without query params
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  /**
   * Respond to window resize events
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 768;

    // If transitioning between mobile and desktop, adjust sidebar state
    if (wasDesktop !== this.isDesktop) {
      if (this.isDesktop) {
        // Transitioning to desktop - check saved preference
        const savedState = localStorage.getItem('sidebarOpen');
        if (savedState !== null) {
          this.sidebarOpen = JSON.parse(savedState);
        } else {
          this.sidebarOpen = true;
        }
      } else {
        // Transitioning to mobile - always close sidebar
        this.sidebarOpen = false;
      }
      this.sidebarToggled.emit(this.sidebarOpen);
    }
  }
}