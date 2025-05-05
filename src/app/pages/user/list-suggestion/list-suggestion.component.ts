import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Import the necessary services and models
import { Cl_getSuggestionPayload, SuggestionService } from '../../../services/suggestion.service';
import { Suggestion } from '../../../models/suggestion';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';
import { Router } from '@angular/router';
import { Cl_getDepartmentPayload, DepartmentService } from '../../../services/department.service';

interface Department {
  department_id: string;
  department_name: string;
}

@Component({
  selector: 'app-list-suggestion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-suggestion.component.html',
  styleUrl: './list-suggestion.component.scss'
})
export class ListSuggestionComponent implements OnInit, OnDestroy {
  // Suggestions data
  suggestions: Suggestion[] = [];
  filteredSuggestions: Suggestion[] = [];
  departments: Department[] = [];

  // Filter and sort options
  searchTerm: string = '';
  selectedDepartment: string = 'all';
  selectedDepartmentName: string = 'All Departments';
  sortBy: string = 'newest';

  // Dropdown control variables
  isDepartmentFilterOpen: boolean = false;
  isSortOpen: boolean = false;

  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  currentUser: UserData | null = null;

  // Delete suggestion modal
  showDeleteModal: boolean = false;
  suggestionToDelete: Suggestion | null = null;

  role: string = '';

  // Unsubscribe observable
  private destroy$ = new Subject<void>();

  constructor(
    private suggestionService: SuggestionService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments and suggestions after getting user data
          this.loadDepartments();
          this.loadSuggestions();
          this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';
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

    // Close department filter dropdown if clicked outside
    if (this.isDepartmentFilterOpen && !target.closest('.relative')) {
      this.isDepartmentFilterOpen = false;
    }

    // Close sort dropdown if clicked outside
    if (this.isSortOpen && !target.closest('.relative')) {
      this.isSortOpen = false;
    }

    // Close action dropdowns if clicked outside
    if (!target.closest('.dropdown-container')) {
      this.filteredSuggestions.forEach(suggestion => {
        suggestion.showActionsDropdown = false;
      });
    }
  }

  /**
   * Load departments for filtering
   */
  loadDepartments(): void {
    if (!this.currentUser) return;

    const departmentData: Cl_getDepartmentPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId
    };

    this.departmentService.getDepartments(departmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
        },
        error: (error) => {
          console.error('Error loading departments:', error);
        }
      });
  }

  /**
   * Load suggestions from the service
   */
  loadSuggestions(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const suggestionData: Cl_getSuggestionPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId,
      id: this.currentUser.userId
    };

    this.suggestionService.getUserSuggestions(suggestionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.suggestions = data;
          this.filteredSuggestions = [...this.suggestions];
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading suggestions:', error);
          this.errorMessage = 'Failed to load suggestions. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Apply filtering and sorting to the suggestions
   */
  applyFilters(): void {
    // First filter by search term
    let result = this.suggestions;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(suggestion =>
        suggestion.subject.toLowerCase().includes(term) ||
        suggestion.description.toLowerCase().includes(term) ||
        suggestion.suggestion_id.toString().includes(term)
      );
    }

    // Then filter by department
    if (this.selectedDepartment !== 'all') {
      result = result.filter(suggestion => suggestion.department_id === this.selectedDepartment);
    }

    // Then sort the results
    result = this.sortSuggestions(result);

    this.filteredSuggestions = result;
  }

  /**
   * Sort suggestions based on selected sort option
   */
  sortSuggestions(suggestions: Suggestion[]): Suggestion[] {
    switch (this.sortBy) {
      case 'newest':
        return [...suggestions].sort((a, b) =>
          new Date(b.created_on || '').getTime() - new Date(a.created_on || '').getTime()
        );
      case 'oldest':
        return [...suggestions].sort((a, b) =>
          new Date(a.created_on || '').getTime() - new Date(b.created_on || '').getTime()
        );
      default:
        return suggestions;
    }
  }

  /**
   * Handle search input changes
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Handle department filter changes
   */
  onDepartmentChange(departmentId: string): void {
    this.selectedDepartment = departmentId;

    if (departmentId === 'all') {
      this.selectedDepartmentName = 'All Departments';
    } else {
      const department = this.departments.find(d => d.department_id === departmentId);
      this.selectedDepartmentName = department?.department_name || 'Selected Department';
    }

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
   * Format date to friendly format
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * View suggestion details
   */
  viewSuggestionDetails(suggestionId: string): void {
    // Don't navigate if any dropdown is open
    if (this.isAnyDropdownOpen()) {
      return;
    }

    this.router.navigate(['/', this.role, 'suggestions', suggestionId]);
  }

  /**
   * Check if any dropdown is open
   */
  isAnyDropdownOpen(): boolean {
    return this.isDepartmentFilterOpen ||
      this.isSortOpen ||
      this.filteredSuggestions.some(s => s.showActionsDropdown);
  }

  /**
   * Toggle actions dropdown for a suggestion
   */
  toggleActionsDropdown(event: Event, suggestion: Suggestion): void {
    event.stopPropagation();

    // Close other dropdowns first
    this.filteredSuggestions.forEach(s => {
      if (s !== suggestion) {
        s.showActionsDropdown = false;
      }
    });

    // Toggle current dropdown
    suggestion.showActionsDropdown = !suggestion.showActionsDropdown;
  }

  /**
   * Check if user can edit a suggestion
   */
  canEdit(suggestion: Suggestion): boolean {
    // Admin can edit any suggestion
    if (this.role === 'admin') return true;

    // HOD can edit suggestions from their department
    if (this.role === 'hod' && this.currentUser) {
      return suggestion.department_id === this.currentUser.l_department_Id;
    }

    // Users can edit their own suggestions
    return suggestion.created_by === this.currentUser?.userId;
  }

  /**
   * Check if user can delete a suggestion
   */
  canDelete(suggestion: Suggestion): boolean {
    // Only admin or suggestion creator can delete
    return this.role === 'admin' || suggestion.created_by === this.currentUser?.userId;
  }

  /**
   * Edit suggestion
   */
  editSuggestion(event: Event, suggestion: Suggestion): void {
    event.stopPropagation();

    // Close dropdown
    suggestion.showActionsDropdown = false;

    // Navigate to edit page
    this.router.navigate(['/', this.role, 'create-suggestion'], {
      queryParams: { id: suggestion.suggestion_id }
    });
  }

  /**
   * Delete suggestion - opens confirmation modal
   */
  deleteSuggestion(event: Event, suggestion: Suggestion): void {
    event.stopPropagation();

    // Close dropdown
    suggestion.showActionsDropdown = false;

    // Set suggestion to delete and show modal
    this.suggestionToDelete = suggestion;
    this.showDeleteModal = true;
  }

  /**
   * Cancel suggestion deletion
   */
  cancelDeleteSuggestion(): void {
    this.showDeleteModal = false;
    this.suggestionToDelete = null;
  }

  /**
   * Confirm suggestion deletion
   */
  confirmDeleteSuggestion(): void {
    if (!this.suggestionToDelete) return;

    const suggestionId = this.suggestionToDelete.suggestion_id;

    this.suggestionService.deleteSuggestion(suggestionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Remove from arrays
            this.suggestions = this.suggestions.filter(s => s.suggestion_id !== suggestionId);
            this.filteredSuggestions = this.filteredSuggestions.filter(s => s.suggestion_id !== suggestionId);

            this.successMessage = 'Suggestion deleted successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          } else {
            this.errorMessage = 'Failed to delete suggestion';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
          this.showDeleteModal = false;
          this.suggestionToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting suggestion:', error);
          this.errorMessage = 'An error occurred while deleting the suggestion';
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
          this.showDeleteModal = false;
          this.suggestionToDelete = null;
        }
      });
  }

  /**
   * Close all dropdowns
   */
  @HostListener('document:click', ['$event'])
  closeAllDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Don't close if clicked on a dropdown toggle
    if (target.closest('.dropdown-toggle')) return;

    // Close all dropdowns
    this.isDepartmentFilterOpen = false;
    this.isSortOpen = false;

    this.filteredSuggestions.forEach(suggestion => {
      suggestion.showActionsDropdown = false;
    });
  }
}
