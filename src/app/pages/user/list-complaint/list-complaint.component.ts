import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Import the necessary services and models
import { Cl_getUserComplaintPayload, ComplaintService } from '../../../services/complaint.service';
import { Complaint } from '../../../models/complaint';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';

@Component({
  selector: 'app-list-complaint',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-complaint.component.html',
  styleUrl: './list-complaint.component.scss'
})
export class ListComplaintComponent implements OnInit, OnDestroy {
  // Complaints data
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];

  // Filter and sort options
  searchTerm: string = '';
  selectedStatus: string = 'all';
  sortBy: string = 'newest';

  // Dropdown control variables
  isStatusFilterOpen: boolean = false;
  isSortOpen: boolean = false;

  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string = '';
  currentUser: UserData | null = null;


  // Unsubscribe observable
  private destroy$ = new Subject<void>();

  constructor(private complaintService: ComplaintService, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => {
      this.currentUser = user;

      if (user) {
        // Load departments after getting user data
        this.loadComplaints();
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove event listener on component destruction
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }

  /**
   * Handle clicks outside the dropdown to close them
   */
  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Close status filter dropdown if clicked outside
    if (this.isStatusFilterOpen && !target.closest('.relative')) {
      this.isStatusFilterOpen = false;
    }

    // Close sort dropdown if clicked outside
    if (this.isSortOpen && !target.closest('.relative')) {
      this.isSortOpen = false;
    }
  }

  /**
   * Load complaints from the service
   */
  loadComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const userComplaint_data: Cl_getUserComplaintPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId,
      id:this.currentUser.userId
    };
    this.complaintService.getUserComplaints(userComplaint_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaints = data;
          this.filteredComplaints = [...this.complaints];
          this.applyFilters();
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
   * Apply filtering and sorting to the complaints
   */
  applyFilters(): void {
    // First filter by search term
    let result = this.complaints;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(complaint =>
        complaint.subject.toLowerCase().includes(term) ||
        complaint.description.toLowerCase().includes(term) ||
        complaint.complaint_id.toString().includes(term)
      );
    }

    // Then filter by status
    if (this.selectedStatus !== 'all') {
      result = result.filter(complaint => complaint.status === this.selectedStatus);
    }

    // Then sort the results
    result = this.sortComplaints(result);

    this.filteredComplaints = result;
  }

  /**
   * Sort complaints based on selected sort option
   */
  sortComplaints(complaints: Complaint[]): Complaint[] {
    switch (this.sortBy) {
      case 'newest':
        return [...complaints].sort((a, b) =>
          new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
        );
      case 'oldest':
        return [...complaints].sort((a, b) =>
          new Date(a.created_on).getTime() - new Date(b.created_on).getTime()
        );
      case 'priority':
      // return [...complaints].sort((a, b) => b.priority - a.priority);
      default:
        return complaints;
    }
  }

  /**
   * Handle search input changes
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Handle status filter changes
   */
  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  /**
   * Handle sort option changes
   */
  onSortChange(sortOption: string): void {
    this.sortBy = sortOption;
    this.applyFilters();
  }

  /**
   * Get appropriate CSS class for status button
   */
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 hover:bg-blue-200 text-blue-800';
      case 'resolved':
        return 'bg-green-100 hover:bg-green-200 text-green-800';
      case 'closed':
        return 'bg-red-100 hover:bg-red-200 text-red-800';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  }

  /**
   * Format date to friendly format
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'short'
    });
  }
}