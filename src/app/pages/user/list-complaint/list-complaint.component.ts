import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Import the necessary services and models
import { Cl_getUserComplaintPayload, ComplaintService } from '../../../services/complaint.service';
import { Complaint, FeedbackAnswer, FeedbackData, FeedbackQuestion, FeedbackQuestionResponse } from '../../../models/complaint';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';
import { Router } from '@angular/router';
import { ComplaintPriority, getPriorityDisplayName } from '../../../enums/complaint_priority';
import { ComplaintStatus, getStatusDisplayName } from '../../../enums/complaint_status';
import { CategoryService } from '../../../services/category.service';
import { TagsService } from '../../../services/tags.service';
import { FindcategoryPipe } from '../../../pipes/findcategory.pipe';
import { FindtagPipe } from '../../../pipes/findtag.pipe';
import { FiltertagPipe } from '../../../pipes/filtertag.pipe';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { SortByOrderPipe } from "../../../pipes/sort-by-order.pipe";

@Component({
  selector: 'app-list-complaint',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FindcategoryPipe, FindtagPipe, FiltertagPipe, TooltipDirective, SortByOrderPipe],
  templateUrl: './list-complaint.component.html',
  styleUrl: './list-complaint.component.scss'
})
export class ListComplaintComponent implements OnInit, OnDestroy {
  // Add the enums as properties for template access
  priorityEnum = ComplaintPriority;
  statusEnum = ComplaintStatus;

  // Create arrays of available statuses and priorities for dropdown options
  availableStatuses = Object.values(ComplaintStatus);
  availablePriorities = Object.values(ComplaintPriority);

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

  // Add these properties to your component class
  showDeferredModal: boolean = false;
  deferralDueDate: string = '';
  deferralReason: string = '';
  deferralDueDateError: string = '';
  deferralReasonError: string = '';
  submittingDeferral: boolean = false;
  selectedComplaint: Complaint | null = null;
  pendingStatusChange: string = '';
  successMessage: string = '';
  deferralDueTime: string = '17:00'; // Default to 5 PM


  // Add these new properties
  showFeedbackModal: boolean = false;
  feedbackData: FeedbackData = this.getEmptyFeedbackData();
  submittingFeedback: boolean = false;
  feedbackSubjectError: string = '';
  feedbackDescriptionError: string = '';
  feedbackRatingError: string = '';
  selectedComplaintForFeedback: Complaint | null = null;

  // Add this property to your component class
  categorySearchTerm: string = '';

  role: string = '';

  selectedCategory: string = 'all';
  selectedTag: string = 'all';
  showAnonymousOnly: boolean = false;

  // Add arrays to store category and tag options
  categories: any[] = [];
  tags: any[] = [];

  // Add these properties for new dropdown controls
  isCategoryFilterOpen: boolean = false;
  isTagFilterOpen: boolean = false;

  // Unsubscribe observable
  private destroy$ = new Subject<void>();
  elementRef: any;

  // Add property for tag search
  tagSearchTerm: string = '';

  // Add these properties to your component class
  feedbackQuestions: FeedbackQuestion[] = [];
  feedbackAnswers: FeedbackAnswer[] = [];
  loadingQuestions: boolean = false;

  constructor(private complaintService: ComplaintService, private authService: AuthService, private router: Router, private categoryService: CategoryService, private tagService: TagsService,) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments after getting user data
          this.loadComplaints();
          this.loadCategories(); // Add this line
          this.loadTags(); // Add this line
          this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';
        }
      });

    this.feedbackQuestions.forEach(question => {
      if (question.feedbackQuestionOptions) {
        question.feedbackQuestionOptions.sort((a, b) => +b.option_order - +a.option_order);
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  // Add this to your component
  ngAfterViewChecked() {
    // This will help debug radio button selection issues
    if (this.feedbackAnswers && this.feedbackAnswers.length > 0) {
      console.log('Current feedback answers:', JSON.stringify(this.feedbackAnswers));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove event listener on component destruction
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }

  /**
 * Initialize empty feedback data object
 */
  getEmptyFeedbackData(): FeedbackData {
    return {
      feedback_id: '',
      subject: 'Feedback on Complaint Resolution',
      description: '',
      rating: 0,
      complaint_id: '',
      created_by: '',
      created_on: '',
      modified_on: '',
      modified_by: '',
      org_id: 1,
      opr_id: 1,
      is_active: 'YES',
      l_created_by: ''
    };
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

  // Add this method to load feedback questions
  loadFeedbackQuestions(): void {
    this.loadingQuestions = true;
    this.complaintService.getFeedbackQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.feedbackQuestions = questions;
          // Initialize empty answers for each question
          this.initFeedbackAnswers();
          this.loadingQuestions = false;
        },
        error: (error) => {
          console.error('Error loading feedback questions:', error);
          this.loadingQuestions = false;
        }
      });
  }

  // Modify or add this method to initialize feedback answers
  // Add this to your component if not already present
  initFeedbackAnswers(): void {
    if (!this.feedbackQuestions || this.feedbackQuestions.length === 0) {
      this.feedbackAnswers = [];
      return;
    }

    this.feedbackAnswers = this.feedbackQuestions.map(q => ({
      response_id: '',
      feedback_id: '',
      question_id: q.question_id,
      selected_option_id: ''
    }));
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
          // The has_feedback property is already included in the response
          // No need to check again for each complaint

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


  // Add methods to load categories and tags
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

  // Add new filter methods
  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onTagChange(tag: string): void {
    this.selectedTag = tag;
    this.applyFilters();
  }

  toggleAnonymousFilter(): void {
    this.showAnonymousOnly = !this.showAnonymousOnly;
    this.applyFilters();
  }

  /**
   * Check if feedback exists for a complaint
   */
  checkFeedbackExistsForComplaint(complaint: Complaint): void {
    if (!this.currentUser) return;

    const payload = {
      complaint_id: complaint.complaint_id,
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId
    };

    this.complaintService.checkFeedbackExists(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hasFeedback) => {
          // Update the complaint with feedback status
          complaint.has_feedback = hasFeedback;
        },
        error: (error) => {
          console.error('Error checking feedback existence:', error);
          // Default to false if there's an error
          complaint.has_feedback = false;
        }
      });
  }

  /**
   * Apply filtering and sorting to the complaints
   */
  // applyFilters(): void {
  //   // First filter by search term
  //   let result = this.complaints;

  //   if (this.searchTerm) {
  //     const term = this.searchTerm.toLowerCase();
  //     result = result.filter(complaint =>
  //       complaint.subject.toLowerCase().includes(term) ||
  //       complaint.description.toLowerCase().includes(term) ||
  //       complaint.complaint_id.toString().includes(term)
  //     );
  //   }

  //   // Then filter by status
  //   if (this.selectedStatus !== 'all') {
  //     result = result.filter(complaint => complaint.status === this.selectedStatus);
  //   }

  //   // Then sort the results
  //   result = this.sortComplaints(result);

  //   this.filteredComplaints = result;
  // }

  /**
   * Sort complaints based on selected sort option
   */
  // sortComplaints(complaints: Complaint[]): Complaint[] {
  //   switch (this.sortBy) {
  //     case 'newest':
  //       return [...complaints].sort((a, b) =>
  //         new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
  //       );
  //     case 'oldest':
  //       return [...complaints].sort((a, b) =>
  //         new Date(a.created_on).getTime() - new Date(b.created_on).getTime()
  //       );
  //     case 'priority':
  //     // return [...complaints].sort((a, b) => b.priority - a.priority);
  //     default:
  //       return complaints;
  //   }
  // }

  /**
   * Handle search input changes
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Handle status filter changes
   */
  // onStatusChange(status: string): void {
  //   console.log('Selected status:', status);
  //   this.selectedStatus = status;
  //   this.applyFilters();
  // }

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
  // getStatusClass(status: string): string {
  //   switch (status.toLowerCase()) {
  //     case 'open':
  //       return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
  //     case 'pending':
  //       return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
  //     case 'in progress':
  //       return 'bg-blue-100 hover:bg-blue-200 text-blue-800';
  //     case 'resolved':
  //       return 'bg-green-100 hover:bg-green-200 text-green-800';
  //     case 'closed':
  //       return 'bg-red-100 hover:bg-red-200 text-red-800';
  //     default:
  //       return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
  //   }
  // }

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


  /**
   * View complaint details but only if no dropdown is open
   */
  viewComplaintDetails(complaintId: string): void {
    // Don't navigate if any dropdown is open
    if (this.isAnyDropdownOpen()) {
      return;
    }

    this.router.navigate(['/', this.role, 'complaints', complaintId]);
  }


  /**
  * Apply filtering and sorting to the complaints
  */
  // Update the tag filter method in the filter function
  applyFilters(): void {
    // First filter by search term
    let result = this.complaints;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(complaint =>
        complaint.subject.toLowerCase().includes(term) ||
        complaint.description.toLowerCase().includes(term) ||
        complaint.complaint_id.toString().includes(term) ||
        (complaint.l_category_name && complaint.l_category_name.toLowerCase().includes(term)) ||
        (complaint.l_tag_name && complaint.l_tag_name.toLowerCase().includes(term))
      );
    }

    // Then filter by status - updated to handle enum values
    if (this.selectedStatus !== 'all') {
      result = result.filter(complaint => complaint.status.toUpperCase() === this.selectedStatus.toUpperCase());
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      result = result.filter(complaint => complaint.category_id === this.selectedCategory);
    }

    // Filter by tag - UPDATED to handle tag_id array
    if (this.selectedTag !== 'all') {
      result = result.filter(complaint => {
        // Check if complaint has tag_id array
        if (complaint.tag_id && Array.isArray(complaint.tag_id)) {
          return complaint.tag_id.includes(this.selectedTag);
        }
        // Fallback to single tag_id for backward compatibility
        else if (complaint.tag_id) {
          return complaint.tag_id === this.selectedTag;
        }
        return false;
      });
    }

    // Filter anonymous complaints
    if (this.showAnonymousOnly) {
      result = result.filter(complaint => complaint.is_anonymous === 'YES');
    }

    // Then sort the results
    result = this.sortComplaints(result);

    this.filteredComplaints = result;
  }


  /**
 * Get tag names as a comma-separated string
 */
  getTagNames(complaint: Complaint): string {
    // Check if complaint has tag_id array
    if (complaint.tag_id && Array.isArray(complaint.tag_id) && complaint.tag_id.length > 0) {
      return complaint.tag_id
        .map(tagId => {
          const tag = this.tags.find(t => t.tag_id === tagId);
          return tag ? tag.tag_name : '';
        })
        .filter(name => name) // Remove empty names
        .join(', ');
    }
    // Fallback to l_tag_name for backward compatibility
    else if (complaint.l_tag_name) {
      return complaint.l_tag_name;
    }
    return '';
  }

  /**
   * Get tag names as an array for badge display
   */
  getTagNameArray(complaint: Complaint): string[] {
    // Check if complaint has tag_id array
    if (complaint.tag_id && Array.isArray(complaint.tag_id) && complaint.tag_id.length > 0) {
      return complaint.tag_id
        .map(tagId => {
          const tag = this.tags.find(t => t.tag_id === tagId);
          return tag ? tag.tag_name : '';
        })
        .filter(name => name); // Remove empty names
    }
    // Fallback to l_tag_name for backward compatibility
    else if (complaint.l_tag_name) {
      return [complaint.l_tag_name];
    }
    return [];
  }


  // For multiple tag handling
  /**
   * Check if a complaint has a specific tag
   */
  hasTag(complaint: Complaint, tagId: string): boolean {
    if (complaint.tag_id && Array.isArray(complaint.tag_id)) {
      return complaint.tag_id.includes(tagId);
    }
    return complaint.tag_id === tagId;
  }

  /**
   * Check if a complaint has any tags
   */
  hasTags(complaint: Complaint): boolean {
    if (complaint.tag_id && Array.isArray(complaint.tag_id)) {
      return complaint.tag_id.length > 0;
    }
    return !!complaint.tag_id || !!complaint.l_tag_name;
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
        // Updated priority sorting to handle enum values
        return [...complaints].sort((a, b) => {
          const priorityOrder = {
            [ComplaintPriority.HIGH]: 3,
            [ComplaintPriority.MEDIUM]: 2,
            [ComplaintPriority.LOW]: 1
          };
          return priorityOrder[b.priority.toUpperCase() as ComplaintPriority] -
            priorityOrder[a.priority.toUpperCase() as ComplaintPriority];
        });
      default:
        return complaints;
    }
  }

  /**
   * Get appropriate CSS class for status button
   */
  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case ComplaintStatus.OPEN:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
      case ComplaintStatus.ASSIGNED:
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
      case ComplaintStatus.IN_PROGRESS:
        return 'bg-blue-100 hover:bg-blue-200 text-blue-800';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-100 hover:bg-green-200 text-green-800';
      case ComplaintStatus.CLOSED:
        return 'bg-red-100 hover:bg-red-200 text-red-800';
      case ComplaintStatus.ESCALATED:
        return 'bg-purple-100 hover:bg-purple-200 text-purple-800';
      case ComplaintStatus.DEFERRED:
        return 'bg-orange-100 hover:bg-orange-200 text-orange-800';
      case ComplaintStatus.REOPEN:
        return 'bg-pink-100 hover:bg-pink-200 text-pink-800';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  }

  /**
   * Get status icon class
   */
  getStatusIconClass(status: string): string {
    switch (status.toUpperCase()) {
      case ComplaintStatus.OPEN:
        return 'bg-gray-200 text-gray-600';
      case ComplaintStatus.ASSIGNED:
        return 'bg-yellow-100 text-yellow-600';
      case ComplaintStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-600';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-100 text-green-600';
      case ComplaintStatus.CLOSED:
        return 'bg-red-100 text-red-600';
      case ComplaintStatus.ESCALATED:
        return 'bg-purple-100 text-purple-600';
      case ComplaintStatus.DEFERRED:
        return 'bg-orange-100 text-orange-600';
      case ComplaintStatus.REOPEN:
        return 'bg-pink-100 text-pink-600';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  }

  /**
   * Get display name for priority
   */
  getPriorityDisplay(priority: string): string {
    return getPriorityDisplayName(priority);
  }

  /**
   * Get display name for status
   */
  getStatusDisplay(status: string): string {
    // console.log('Status:', status);
    return getStatusDisplayName(status);
  }

  /**
   * Check if priority is high
   */
  isHighPriority(priority: string): boolean {
    return priority.toUpperCase() === ComplaintPriority.HIGH;
  }

  /**
   * Toggle the status dropdown, checking if the user has permission to change status
   */
  toggleStatusDropdown(event: Event, complaint: Complaint): void {
    event.stopPropagation();

    // Store the selected complaint for use in getAllowedStatusTransitions
    this.selectedComplaint = complaint;

    // Special case for resolved complaints - creators can change to reopen or closed
    const isResolvedCreatorComplaint =
      complaint.status.toUpperCase() === ComplaintStatus.RESOLVED &&
      complaint.created_by === this.currentUser?.userId;

    // For employees, prevent status changes on their own complaints (except when resolved)
    if (this.role === 'employee' &&
      complaint.created_by === this.currentUser?.userId &&
      !isResolvedCreatorComplaint) {
      // Show message that employees can't change status of their own complaints
      this.errorMessage = "You cannot change the status of complaints you've created.";
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Close other dropdowns first
    this.filteredComplaints.forEach(c => {
      if (c !== complaint) {
        c.showStatusDropdown = false;
      }
    });

    // Toggle current dropdown
    complaint.showStatusDropdown = !complaint.showStatusDropdown;

    // Add class to parent row for better z-index control
    if (complaint.showStatusDropdown) {
      setTimeout(() => {
        const rowElement = (event.target as HTMLElement).closest('.hover\\:bg-gray-50');
        if (rowElement) {
          rowElement.classList.add('row-has-dropdown-open');
        }
      });
    } else {
      const rowElement = (event.target as HTMLElement).closest('.hover\\:bg-gray-50');
      if (rowElement) {
        rowElement.classList.remove('row-has-dropdown-open');
      }
    }
  }

  /**
   * Check if the current user can update the status of this complaint
   */
  canUpdateStatus(complaint: Complaint): boolean {
    // Special case: Allow the original creator to reopen or close a RESOLVED complaint
    if (complaint.status.toUpperCase() === ComplaintStatus.RESOLVED &&
      complaint.created_by === this.currentUser?.userId) {
      return true;
    }

    // HODs can update any complaint status
    if (this.role === 'hod') return true;

    // Employees can only update complaints they didn't create (except for the RESOLVED case above)
    if (this.role === 'employee') {
      return complaint.created_by !== this.currentUser?.userId;
    }

    // Other roles (admin, client) are determined by their own logic
    return false;
  }
  /**
/**
 * Update the status of a complaint
 */
  updateComplaintStatus(event: Event, complaint: Complaint, newStatus: string): void {
    // Stop event propagation to prevent row click
    event.stopPropagation();

    // Close dropdown
    complaint.showStatusDropdown = false;

    // Special case: Allow complaint creator to reopen or close their resolved complaints
    const isCreatorWithResolvedComplaint =
      complaint.created_by === this.currentUser?.userId &&
      complaint.status.toUpperCase() === ComplaintStatus.RESOLVED &&
      (newStatus.toUpperCase() === ComplaintStatus.REOPEN ||
        newStatus.toUpperCase() === ComplaintStatus.CLOSED);

    // Check if user is authorized to update status (with special case for creator)
    if (this.role === 'employee' &&
      complaint.created_by === this.currentUser?.userId &&
      !isCreatorWithResolvedComplaint) {
      this.errorMessage = "You cannot change the status of complaints you've created.";
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Skip if status didn't change
    if (complaint.status.toUpperCase() === newStatus.toUpperCase()) {
      return;
    }

    // Special handling for DEFERRED status
    if (newStatus.toUpperCase() === ComplaintStatus.DEFERRED) {
      this.handleDeferredStatus(complaint, newStatus);
      return;
    }

    if (newStatus.toUpperCase() === ComplaintStatus.ASSIGNED) {
      this.errorMessage = "You cannot change the status to assigned until anyone is assigned to this complaint.";
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Proceed with normal status update for other statuses
    this.processStatusUpdate(complaint, newStatus);
  }
  /**
   * Get allowed status transitions based on current status and user permissions
   */
  getAllowedStatusTransitions(currentStatus: string): string[] {
    const status = currentStatus.toUpperCase();

    // Special case: If this is a RESOLVED complaint and the current user is the creator,
    // allow both REOPEN and CLOSED actions
    if (status === ComplaintStatus.RESOLVED &&
      this.selectedComplaint?.created_by === this.currentUser?.userId) {
      return [ComplaintStatus.REOPEN, ComplaintStatus.CLOSED];
    }

    // Define valid transitions for each status
    switch (status) {
      case ComplaintStatus.OPEN:
        return [ComplaintStatus.ASSIGNED];

      case ComplaintStatus.ASSIGNED:
        return [ComplaintStatus.IN_PROGRESS, ComplaintStatus.DEFERRED];

      case ComplaintStatus.IN_PROGRESS:
        return [ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED, ComplaintStatus.DEFERRED];

      case ComplaintStatus.RESOLVED:
        // For other users who aren't the creator, they can still close
        return [ComplaintStatus.CLOSED];

      case ComplaintStatus.REOPEN:
        return [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ASSIGNED];

      case ComplaintStatus.ESCALATED:
        return [ComplaintStatus.ASSIGNED, ComplaintStatus.CLOSED];

      case ComplaintStatus.DEFERRED:
        return [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS];

      case ComplaintStatus.CLOSED:
        // Closed is terminal state - no transitions
        return [];

      default:
        return [];
    }
  }

  /**
   * Update the status of a complaint
   */
  // updateComplaintStatus(event: Event, complaint: Complaint, newStatus: string): void {
  //   // Stop event propagation to prevent row click
  //   event.stopPropagation();

  //   // Close dropdown
  //   complaint.showStatusDropdown = false;

  //   // Skip if status didn't change
  //   if (complaint.status.toUpperCase() === newStatus.toUpperCase()) {
  //     return;
  //   }

  //   // Show loading indicator or disable the UI during update
  //   this.isLoading = true;


  //   // Create update payload
  //   const updatedComplaint = {
  //     ...complaint,
  //     l_previous_status: complaint.status,
  //     status: newStatus,
  //     // modified_by: this.currentUser?.userId,
  //     // modified_on: new Date().toISOString() // Backend should handle proper date formatting
  //   };

  //   console.log('Updated complaint:', updatedComplaint);
  //   // Call API to update status
  //   this.complaintService.updateComplaint(updatedComplaint)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         if (response && response.status) {
  //           // Update local complaint status
  //           complaint.status = newStatus;

  //           // Show a success notification if needed
  //           // this.showNotification('Status updated successfully');
  //         } else {
  //           // Handle error from API
  //           this.errorMessage = response?.statusMsg || 'Failed to update status';
  //         }
  //         this.isLoading = false;
  //       },
  //       error: (error) => {
  //         console.error('Error updating status:', error);
  //         this.errorMessage = 'An error occurred while updating status';
  //         this.isLoading = false;
  //       }
  //     });
  // }

  /**
   * Check if any dropdown is open
   */
  isAnyDropdownOpen(): boolean {
    return this.isStatusFilterOpen ||
      this.isSortOpen ||
      this.isCategoryFilterOpen ||
      this.isTagFilterOpen ||
      this.filteredComplaints.some(c => c.showStatusDropdown);
  }

  /**
 * Handle document clicks to close dropdowns
 */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // First, check if the event target exists
    if (!event || !event.target) {
      return;
    }

    const target = event.target as HTMLElement;

    // Check if the click is on a dropdown toggle - with proper null checking
    const dropdownToggle = target.closest('.dropdown-toggle');
    const isStatusToggle = dropdownToggle &&
      dropdownToggle.textContent?.includes(
        this.selectedStatus === 'all' ? 'All Status' : this.getStatusDisplay(this.selectedStatus)
      );

    // Don't close the status dropdown if clicking on its toggle
    if (isStatusToggle) {
      return;
    }

    // Close dropdowns when clicking outside
    if (this.isStatusFilterOpen && !target.closest('.dropdown-menu')) {
      this.isStatusFilterOpen = false;
    }

    // Rest of your existing code...
    if (this.isCategoryFilterOpen && !target.closest('.category-dropdown')) {
      this.isCategoryFilterOpen = false;
    }

    if (this.isTagFilterOpen && !target.closest('.tag-dropdown')) {
      this.isTagFilterOpen = false;
    }

    // For the feedback modal, don't close anything when clicking inside the modal
    if (this.showFeedbackModal && target.closest('.feedback-modal')) {
      // Do nothing - allow clicks inside the modal
      return;
    }
  }

  /**
   * Toggle status filter dropdown
   */
  toggleStatusFilter(event: Event): void {
    // Ensure event exists and stop propagation
    if (!event) return;
    event.stopPropagation();

    // Close other dropdowns first
    this.isCategoryFilterOpen = false;
    this.isTagFilterOpen = false;
    this.isSortOpen = false;

    // Toggle status dropdown
    this.isStatusFilterOpen = !this.isStatusFilterOpen;
  }
  /**
   * Handle status filter changes with event prevention
   */
  onStatusChange(status: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    console.log('Selected status:', status);
    this.selectedStatus = status;
    this.applyFilters();
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    // Close filter and sort dropdowns
    this.isStatusFilterOpen = false;
    this.isSortOpen = false;
    this.isCategoryFilterOpen = false;
    this.isTagFilterOpen = false;

    // Close all complaint status dropdowns
    this.filteredComplaints.forEach(complaint => {
      complaint.showStatusDropdown = false;
    });
  }



  /**
 * Get today's date in YYYY-MM-DD format for min attribute
 */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Update the status of a complaint
   */
  // updateComplaintStatus(event: Event, complaint: Complaint, newStatus: string): void {
  //   // Stop event propagation to prevent row click
  //   event.stopPropagation();

  //   // Close dropdown
  //   complaint.showStatusDropdown = false;

  //   // Skip if status didn't change
  //   if (complaint.status.toUpperCase() === newStatus.toUpperCase()) {
  //     return;
  //   }

  //   // Special handling for DEFERRED status
  //   if (newStatus.toUpperCase() === ComplaintStatus.DEFERRED) {
  //     this.handleDeferredStatus(complaint, newStatus);
  //     return;
  //   }

  //   // Proceed with normal status update for other statuses
  //   this.processStatusUpdate(complaint, newStatus);
  // }

  /**
   * Special handling for DEFERRED status that requires due date and reason
   */
  handleDeferredStatus(complaint: Complaint, newStatus: string): void {
    // Store the selected complaint and pending status change
    this.selectedComplaint = complaint;
    this.pendingStatusChange = newStatus;

    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.deferralDueDate = tomorrow.toISOString().split('T')[0];
    this.deferralDueTime = '17:00'; // Default to 5 PM

    // Reset other modal form fields
    this.deferralReason = '';
    this.deferralDueDateError = '';
    this.deferralReasonError = '';
    this.submittingDeferral = false;

    // Show the modal
    this.showDeferredModal = true;
  }

  /**
   * Set due date based on preset values (days from today)
   */
  setDueDatePreset(days: number): void {
    const date = new Date();
    date.setDate(date.getDate() + days);

    // Update the date input
    this.deferralDueDate = date.toISOString().split('T')[0];

    // Keep the current time or default to 5 PM
    if (!this.deferralDueTime) {
      this.deferralDueTime = '17:00'; // 5 PM
    }
  }

  /**
   * Validate deferral form inputs
   */
  validateDeferralForm(): boolean {
    let isValid = true;

    // Validate due date
    if (!this.deferralDueDate) {
      this.deferralDueDateError = 'Due date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(this.deferralDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.deferralDueDateError = 'Due date cannot be in the past';
        isValid = false;
      } else {
        this.deferralDueDateError = '';
      }
    }

    // Validate time - ensure it's provided
    if (!this.deferralDueTime) {
      this.deferralDueDateError = 'Time is required';
      isValid = false;
    }

    // Validate reason
    if (!this.deferralReason || this.deferralReason.trim().length === 0) {
      this.deferralReasonError = 'Reason for deferral is required';
      isValid = false;
    } else if (this.deferralReason.trim().length < 10) {
      this.deferralReasonError = 'Please provide a more detailed reason (at least 10 characters)';
      isValid = false;
    } else {
      this.deferralReasonError = '';
    }

    return isValid;
  }

  /**
   * Confirm deferral status update with due date and reason
   */
  confirmDeferralUpdate(): void {
    // Validate form first
    if (!this.validateDeferralForm()) {
      return;
    }

    this.submittingDeferral = true;

    // Make sure we have a selected complaint
    if (!this.selectedComplaint || !this.pendingStatusChange) {
      console.error('No complaint or status selected for deferral');
      this.submittingDeferral = false;
      return;
    }

    // Format the due date for API with time included
    const [year, month, day] = this.deferralDueDate.split('-');
    const [hours, minutes] = this.deferralDueTime.split(':');
    const formattedDueDate = `${year}-${month}-${day} ${hours}:${minutes}:00.000`;

    // Call the update method with the deferred status details
    this.processDeferralUpdate(
      this.selectedComplaint,
      this.pendingStatusChange,
      formattedDueDate,
      this.deferralReason
    );
  }

  /**
   * Cancel deferral update and close modal
   */
  cancelDeferralUpdate(): void {
    this.showDeferredModal = false;
    this.selectedComplaint = null;
    this.pendingStatusChange = '';
  }

  /**
   * Validate deferral form inputs
   */
  // validateDeferralForm(): boolean {
  //   let isValid = true;

  //   // Validate due date
  //   if (!this.deferralDueDate) {
  //     this.deferralDueDateError = 'Due date is required';
  //     isValid = false;
  //   } else {
  //     const selectedDate = new Date(this.deferralDueDate);
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);

  //     if (selectedDate < today) {
  //       this.deferralDueDateError = 'Due date cannot be in the past';
  //       isValid = false;
  //     } else {
  //       this.deferralDueDateError = '';
  //     }
  //   }

  //   // Validate reason
  //   if (!this.deferralReason || this.deferralReason.trim().length === 0) {
  //     this.deferralReasonError = 'Reason for deferral is required';
  //     isValid = false;
  //   } else if (this.deferralReason.trim().length < 10) {
  //     this.deferralReasonError = 'Please provide a more detailed reason (at least 10 characters)';
  //     isValid = false;
  //   } else {
  //     this.deferralReasonError = '';
  //   }

  //   return isValid;
  // }

  /**
   * Confirm deferral status update with due date and reason
   */
  // confirmDeferralUpdate(): void {
  //   // Validate form first
  //   if (!this.validateDeferralForm()) {
  //     return;
  //   }

  //   this.submittingDeferral = true;

  //   // Make sure we have a selected complaint
  //   if (!this.selectedComplaint || !this.pendingStatusChange) {
  //     console.error('No complaint or status selected for deferral');
  //     this.submittingDeferral = false;
  //     return;
  //   }

  //   // Format the due date for API
  //   const [year, month, day] = this.deferralDueDate.split('-');
  //   const formattedDueDate = `${year}-${month}-${day} 17:00:00.000`; // Default to 5 PM

  //   // Call the update method with the deferred status details
  //   console.log(this.deferralReason)
  //   this.processDeferralUpdate(
  //     this.selectedComplaint,
  //     this.pendingStatusChange,
  //     formattedDueDate,
  //     this.deferralReason
  //   );
  // }

  /**
   * Process the deferred status update with additional fields
   */
  processDeferralUpdate(complaint: Complaint, newStatus: string, dueDate: string, reason: string): void {
    // Create update payload with due date and reason
    const updatedComplaint = {
      ...complaint,
      l_previous_status: complaint.status,
      status: newStatus,
      due_date: dueDate,
      l_deffered_reason: reason,
      // modified_by: this.currentUser?.userId,
      // modified_on: new Date().toISOString()
    };
    console.log(updatedComplaint)
    // Use the service to update the complaint
    this.complaintService.updateComplaint(updatedComplaint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status) {
            // Update local complaint status and fields
            complaint.status = newStatus;
            complaint.due_date = dueDate;
            complaint.l_deffered_reason = reason;

            // Show success notification
            this.successMessage = 'Complaint has been deferred successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          } else {
            // Handle error from API
            this.errorMessage = response?.statusMsg || 'Failed to defer complaint';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
          this.submittingDeferral = false;
          this.showDeferredModal = false;
        },
        error: (error) => {
          console.error('Error deferring complaint:', error);
          this.errorMessage = 'An error occurred while updating status';
          this.submittingDeferral = false;
          this.showDeferredModal = false;

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
  }

  /**
   * Process normal status update (non-deferred)
   */
  processStatusUpdate(complaint: Complaint, newStatus: string): void {
    // Show loading indicator
    this.isLoading = true;

    // Create update payload
    const updatedComplaint = {
      ...complaint,
      l_previous_status: complaint.status,
      status: newStatus,
    };

    // Call API to update status
    this.complaintService.updateComplaint(updatedComplaint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status) {
            // Update local complaint status
            complaint.status = newStatus;

            // Show success notification
            this.successMessage = `Status updated to ${getStatusDisplayName(newStatus)}`;
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          } else {
            // Handle error from API
            this.errorMessage = response?.statusMsg || 'Failed to update status';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.errorMessage = 'An error occurred while updating status';
          this.isLoading = false;

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
  }


  /**
   * Open feedback modal for a complaint
   */
  openFeedbackModal(event: Event, complaint: Complaint): void {
    event.stopPropagation();

    // If feedback already exists, don't allow submitting new feedback
    if (complaint.has_feedback) {
      this.successMessage = 'Feedback has already been submitted for this complaint';
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
      return;
    }

    // Reset feedback form
    this.feedbackData = this.getEmptyFeedbackData();
    this.feedbackData.complaint_id = complaint.complaint_id;
    this.feedbackData.subject = `Feedback on Complaint #${complaint.complaint_id}`;

    // Set user info
    if (this.currentUser) {
      this.feedbackData.created_by = this.currentUser.userId;
      this.feedbackData.org_id = parseInt(this.currentUser.organizationId) || 1;
      this.feedbackData.opr_id = parseInt(this.currentUser.operatingUnitId) || 1;
    }

    // Store selected complaint
    this.selectedComplaintForFeedback = complaint;

    // Reset error messages
    this.feedbackSubjectError = '';
    this.feedbackDescriptionError = '';
    this.feedbackRatingError = '';

    // Load feedback questions if not already loaded
    if (this.feedbackQuestions.length === 0) {
      this.loadFeedbackQuestions();
    } else {
      // Reset answers
      this.initFeedbackAnswers();
    }

    // Show modal
    this.showFeedbackModal = true;
  }

  // Update the selectAnswer method to use the new structure
  selectAnswer(questionId: string, optionId: string): void {
    console.log('Selecting answer:', questionId, optionId);

    // Initialize feedbackAnswers if it doesn't exist
    if (!this.feedbackAnswers) {
      this.initFeedbackAnswers();
    }

    const answer = this.feedbackAnswers.find(a => a.question_id === questionId);
    if (answer) {
      answer.selected_option_id = optionId;
    } else {
      // If the answer object doesn't exist, create it
      this.feedbackAnswers.push({
        response_id: '',
        feedback_id: '',
        question_id: questionId,
        selected_option_id: optionId
      });
    }
  }


  /**
   * Set rating for feedback
   */
  setRating(rating: number): void {
    this.feedbackData.rating = rating;
    this.feedbackRatingError = '';
  }

  // Add to list-complaint.component.ts
  // Make sure this function exists and works correctly
  getFeedbackAnswer(questionId: string): any {
    if (!this.feedbackAnswers) return null;
    return this.feedbackAnswers.find(a => a.question_id === questionId);
  }

  getRatingText(rating: number): string {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  }

  /**
   * Cancel feedback submission
   */
  cancelFeedback(): void {
    this.showFeedbackModal = false;
    this.selectedComplaintForFeedback = null;
  }

  /**
   * Validate feedback form
   */
  validateFeedbackForm(): boolean {
    let isValid = true;

    // Validate subject
    if (!this.feedbackData.subject || this.feedbackData.subject.trim().length === 0) {
      this.feedbackSubjectError = 'Subject is required';
      isValid = false;
    } else {
      this.feedbackSubjectError = '';
    }

    // Validate rating
    if (this.feedbackData.rating === 0) {
      this.feedbackRatingError = 'Please provide a rating';
      isValid = false;
    } else {
      this.feedbackRatingError = '';
    }

    // Validate description
    if (!this.feedbackData.description || this.feedbackData.description.trim().length === 0) {
      this.feedbackDescriptionError = 'Description is required';
      isValid = false;
    } else if (this.feedbackData.description.trim().length < 10) {
      this.feedbackDescriptionError = 'Please provide more detailed feedback (at least 10 characters)';
      isValid = false;
    } else {
      this.feedbackDescriptionError = '';
    }

    const unansweredQuestions = this.feedbackAnswers.filter(a => !a.selected_option_id);
    if (unansweredQuestions.length > 0) {
      this.errorMessage = 'Please answer all questions';
      isValid = false;
    }

    return isValid;
  }


  /**
   * Submit feedback
   */
  submitFeedback(): void {
    // Validate form
    if (!this.validateFeedbackForm()) {
      return;
    }

    this.submittingFeedback = true;

    // Add timestamps
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.000`;

    // this.feedbackData.created_on = formattedDate;
    this.feedbackData.created_on = '';


    // Submit feedback using the service
    this.complaintService.saveFeedback(this.feedbackData, this.feedbackAnswers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status) {
            // Update local complaint to show feedback was submitted
            if (this.selectedComplaintForFeedback) {
              this.selectedComplaintForFeedback.has_feedback = true;
            }

            // Show success message
            this.successMessage = 'Feedback submitted successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);

            // Close modal
            this.showFeedbackModal = false;
            this.selectedComplaintForFeedback = null;
          } else {
            // Handle error from API
            this.errorMessage = response?.statusMsg || 'Failed to submit feedback';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
          this.submittingFeedback = false;
        },
        error: (error) => {
          console.error('Error submitting feedback:', error);
          this.errorMessage = 'An error occurred while submitting feedback';
          this.submittingFeedback = false;

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
  }
}



