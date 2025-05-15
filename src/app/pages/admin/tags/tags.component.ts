import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';
import { Tags } from '../../../models/tags';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { TagsService } from '../../../services/tags.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss'
})
export class TagsComponent implements OnInit, OnDestroy {
  // Tag form fields
  tagId: string = '';
  tagName: string = '';
  tagStatus: string = 'YES'; // Default to active
  selectedCategoryId: string = '';
  selectedDepartmentId: string = '';

  // Search and filter
  searchTerm: string = '';
  filterCategory: string = ''; // For filtering by category
  filterDepartment: string = ''; // For filtering by department

  // Tags list
  tags: Tags[] = [];

  // Categories for dropdown
  categories: Category[] = [];

  // Departments for dropdown
  departments: Department[] = [];

  // Filtered categories (based on selected department)
  filteredCategories: Category[] = [];

  // Edit mode
  isEditMode: boolean = false;
  editingTagId: string = '';

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  // Current user data
  currentUser: UserData | null = null;

  // Error messages
  errorMessage: string = '';
  successMessage: string = '';

  // For unsubscribing from observables
  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagsService,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private authService: AuthService
  ) { }

  /**
   * Initialize the component and load initial data
   */
  ngOnInit(): void {
    // Get current user data
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments first
          this.loadDepartments();
          // Then load categories
          this.loadAllCategories();
          // Then load tags
          this.loadTags();
        }
      });
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load departments for the dropdown
   */
  loadDepartments(): void {
    if (!this.currentUser) return;

    const department_data = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId
    };

    this.departmentService.getDepartments(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
        },
        error: (error) => {
          console.error('Error loading departments:', error);
          this.errorMessage = 'Failed to load departments. Please try again.';
        }
      });
  }

  /**
   * Load all categories for dropdown
   */
  loadAllCategories(): void {
    if (!this.currentUser) return;

    // Get all categories by passing empty department ID
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
          this.updateFilteredCategories();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Failed to load categories. Please try again.';
        }
      });
  }

  /**
   * Load categories filtered by department
   */
  loadCategoriesByDepartment(departmentId: string): void {
    if (!this.currentUser) return;

    // Get categories for the selected department
    const payload = {
      org_id: parseInt(this.currentUser.organizationId),
      opr_id: parseInt(this.currentUser.operatingUnitId),
      id: departmentId
    };

    this.categoryService.getCategoriesByDepartment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.filteredCategories = data;
          // Reset category if the previously selected one is not available
          if (this.selectedCategoryId && !this.filteredCategories.find(c => c.category_id === this.selectedCategoryId)) {
            this.selectedCategoryId = '';
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Failed to load categories. Please try again.';
        }
      });
  }

  /**
   * Update filtered categories based on selected department
   */
  updateFilteredCategories(): void {
    if (this.selectedDepartmentId) {
      this.filteredCategories = this.categories.filter(
        cat => cat.department_id === this.selectedDepartmentId
      );
    } else {
      this.filteredCategories = [...this.categories];
    }
  }

  /**
   * Handle department change
   */
  onDepartmentChange(): void {
    this.selectedCategoryId = ''; // Reset category selection
    this.updateFilteredCategories();
    if (this.selectedDepartmentId) {
      this.loadCategoriesByDepartment(this.selectedDepartmentId);
    }
  }

  /**
   * Load tags with optional search and filtering
   */
  loadTags(): void {
    if (!this.currentUser) return;

    // Get all tags by passing empty category ID
    const payload = {
      org_id: parseInt(this.currentUser.organizationId),
      opr_id: parseInt(this.currentUser.operatingUnitId),
      id: this.filterCategory || "" // If filterCategory is set, use it
    };

    this.tagService.getTagsByCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          let result = [...data];

          // Apply search filter if needed
          if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(tag =>
              tag.tag_name.toLowerCase().includes(term)
            );
          }

          // Filter by department if selected
          if (this.filterDepartment) {
            // Find categories for the selected department
            const departmentCategories = this.categories.filter(
              cat => cat.department_id === this.filterDepartment
            ).map(cat => cat.category_id);

            // Filter tags by those categories
            result = result.filter(tag =>
              departmentCategories.includes(tag.category_id)
            );
          }

          this.tags = result;
        },
        error: (error) => {
          console.error('Error loading tags:', error);
          this.errorMessage = 'Failed to load tags. Please try again.';
        }
      });
  }

  /**
   * Handle form submission to create or update tag
   */
  onSubmit(form: any): void {
    // Form validation
    if (!this.tagName.trim()) {
      this.errorMessage = 'Tag name is required';
      return;
    }

    if (!this.selectedCategoryId) {
      this.errorMessage = 'Category selection is required';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'User authentication required';
      return;
    }

    const tagData: Tags = {
      tag_id: this.isEditMode ? this.editingTagId : "",
      tag_name: this.tagName.trim(),
      category_id: this.selectedCategoryId,
      org_id: parseInt(this.currentUser?.organizationId),
      opr_id: parseInt(this.currentUser?.operatingUnitId),
      is_active: this.tagStatus,
      created_by: !this.isEditMode ? this.currentUser?.userId : "",
      modified_by: this.isEditMode ? this.currentUser?.userId : ""
    };

    // If editing, update existing tag
    if (this.isEditMode && this.editingTagId) {
      this.updateTag(tagData, form);
    } else {
      // Otherwise create new tag
      this.createTag(tagData, form);
    }
  }

  /**
   * Create a new tag
   * @param tagData Tag data to create
   * @param form NgForm reference to reset validation state
   */
  createTag(tagData: Tags, form: any): void {
    this.tagService.createTag(tagData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Tag created successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadTags();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to create tag';
          }
        },
        error: (error) => {
          console.error('Error creating tag:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Update an existing tag
   * @param tagData Tag data to update
   * @param form NgForm reference to reset validation state
   */
  updateTag(tagData: Tags, form: any): void {
    this.tagService.updateTag(tagData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Tag updated successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadTags();
            this.isEditMode = false;

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update tag';
          }
        },
        error: (error) => {
          console.error('Error updating tag:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Set the edit mode and populate form with tag data
   * @param tag Tag to edit
   */
  editTag(tag: Tags): void {
    this.isEditMode = true;
    this.editingTagId = tag.tag_id;
    this.tagId = tag.tag_id;
    this.tagName = tag.tag_name;
    this.tagStatus = tag.is_active || 'YES';

    // Find the category to get its department
    const category = this.categories.find(c => c.category_id === tag.category_id);
    if (category) {
      this.selectedDepartmentId = category.department_id;
      // Update filtered categories for this department
      this.updateFilteredCategories();
    }

    this.selectedCategoryId = tag.category_id;

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Change tag status (activate/deactivate)
   * @param tag Tag to update
   * @param newStatus New status value
   */
  changeTagStatus(tag: Tags, newStatus: string): void {
    const updatedTag = {
      ...tag,
      is_active: newStatus,
      modified_by: this.currentUser?.userId
    };

    this.tagService.updateTag(updatedTag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = `Tag ${newStatus === 'YES' ? 'activated' : 'deactivated'} successfully`;
            this.loadTags();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update tag status';
          }
        },
        error: (error) => {
          console.error('Error changing tag status:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  // Add this getter method to your TagsComponent class
  get filteredCategoriesForDropdown(): Category[] {
    if (this.filterDepartment) {
      return this.categories.filter(c => c.department_id === this.filterDepartment);
    }
    return this.categories;
  }

  /**
   * Clear the form and reset to add mode
   * @param form Optional NgForm to reset validation state
   */
  clearForm(form?: any): void {
    this.tagName = '';
    this.tagStatus = 'YES';
    this.selectedCategoryId = '';
    this.selectedDepartmentId = '';
    this.errorMessage = '';
    this.isEditMode = false;
    this.editingTagId = '';

    // Reset the form validation state if form is provided
    if (form) {
      form.resetForm({
        tagName: '',
        tagStatus: 'YES',
        selectedCategoryId: '',
        selectedDepartmentId: ''
      });
    }

    // Reset filtered categories
    this.updateFilteredCategories();
  }

  /**
   * Perform search on tags
   */
  searchTags(): void {
    this.loadTags();
  }

  /**
   * Filter tags by category
   */
  onCategoryFilterChange(): void {
    this.loadTags();
  }

  /**
   * Filter tags by department
   */
  onDepartmentFilterChange(): void {
    if (this.filterDepartment) {
      // Update category filter dropdown with categories from selected department
      const departmentCategories = this.categories.filter(
        cat => cat.department_id === this.filterDepartment
      );

      // If the currently selected category doesn't belong to this department, reset it
      if (this.filterCategory) {
        const categoryBelongsToDepartment = departmentCategories.some(
          cat => cat.category_id === this.filterCategory
        );

        if (!categoryBelongsToDepartment) {
          this.filterCategory = '';
        }
      }
    }

    this.loadTags();
  }

  /**
   * Get category name by ID
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown Category';
  }

  /**
   * Get department name by category ID
   */
  getDepartmentNameByCategory(categoryId: string): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    if (category) {
      const department = this.departments.find(d => d.department_id === category.department_id);
      return department ? department.department_name : 'Unknown Department';
    }
    return 'Unknown Department';
  }

  /**
   * Handle page change for pagination
   * @param page Page number to navigate to
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadTags();
    }
  }
}