import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent implements OnInit, OnDestroy {
  // Category form fields
  categoryId: string = '';
  categoryName: string = '';
  categoryDescription: string = '';
  categoryStatus: string = 'YES'; // Default to active
  selectedDepartmentId: string = '';

  // Search and filter
  searchTerm: string = '';
  filterDepartment: string = ''; // For filtering by department

  // Categories list
  categories: Category[] = [];

  // Departments for dropdown
  departments: Department[] = [];

  // Edit mode
  isEditMode: boolean = false;
  editingCategoryId: string = '';

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
          // Then load categories after departments are loaded
          this.loadCategories();
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
   * Load categories with optional search and pagination
   */
  loadCategories(): void {
    if (!this.currentUser) return;

    // Get all categories by passing empty department ID
    const payload = {
      org_id: parseInt(this.currentUser.organizationId),
      opr_id: parseInt(this.currentUser.operatingUnitId),
      id: this.filterDepartment || "" // If filterDepartment is set, use it
    };

    this.categoryService.getCategoriesByDepartment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Apply search filter if needed
          if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            this.categories = data.filter(cat =>
              cat.category_name.toLowerCase().includes(term) ||
              (cat.description && cat.description.toLowerCase().includes(term))
            );
          } else {
            this.categories = data;
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Failed to load categories. Please try again.';
        }
      });
  }

  /**
   * Handle form submission to create or update category
   */
  onSubmit(form: any): void {
    // Form validation
    if (!this.categoryName.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    if (!this.selectedDepartmentId) {
      this.errorMessage = 'Department selection is required';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'User authentication required';
      return;
    }

    const categoryData: Category = {
      category_id: this.isEditMode ? this.editingCategoryId : "",
      category_name: this.categoryName.trim(),
      description: this.categoryDescription.trim(),
      department_id: this.selectedDepartmentId,
      is_active: this.categoryStatus,
      org_id: parseInt(this.currentUser?.organizationId),
      opr_id: parseInt(this.currentUser?.operatingUnitId),
      created_by: !this.isEditMode ? this.currentUser?.userId : "",
      modified_by: this.isEditMode ? this.currentUser?.userId : ""
    };

    // If editing, update existing category
    if (this.isEditMode && this.editingCategoryId) {
      this.updateCategory(categoryData, form);
    } else {
      // Otherwise create new category
      this.createCategory(categoryData, form);
    }
  }

  /**
   * Create a new category
   * @param categoryData Category data to create
   * @param form NgForm reference to reset validation state
   */
  createCategory(categoryData: Category, form: any): void {
    this.categoryService.createCategory(categoryData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Category created successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadCategories();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to create category';
          }
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Update an existing category
   * @param categoryData Category data to update
   * @param form NgForm reference to reset validation state
   */
  updateCategory(categoryData: Category, form: any): void {
    this.categoryService.updateCategory(categoryData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Category updated successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadCategories();
            this.isEditMode = false;

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update category';
          }
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Set the edit mode and populate form with category data
   * @param category Category to edit
   */
  editCategory(category: Category): void {
    this.isEditMode = true;
    this.editingCategoryId = category.category_id;
    this.categoryId = category.category_id;
    this.categoryName = category.category_name;
    this.categoryDescription = category.description || '';
    this.categoryStatus = category.is_active || 'YES';
    this.selectedDepartmentId = category.department_id;

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Change category status (activate/deactivate)
   * @param categoryId Category ID to update
   * @param newStatus New status value
   */
  changeCategoryStatus(category: Category, newStatus: string): void {
    const updatedCategory = {
      ...category,
      is_active: newStatus,
      modified_by: this.currentUser?.userId
    };

    this.categoryService.updateCategory(updatedCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = `Category ${newStatus === 'YES' ? 'activated' : 'deactivated'} successfully`;
            this.loadCategories();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update category status';
          }
        },
        error: (error) => {
          console.error('Error changing category status:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Clear the form and reset to add mode
   * @param form Optional NgForm to reset validation state
   */
  clearForm(form?: any): void {
    this.categoryName = '';
    this.categoryDescription = '';
    this.categoryStatus = 'YES';
    this.selectedDepartmentId = '';
    this.errorMessage = '';
    this.isEditMode = false;
    this.editingCategoryId = '';

    // Reset the form validation state if form is provided
    if (form) {
      form.resetForm({
        categoryName: '',
        categoryDescription: '',
        categoryStatus: 'YES',
        selectedDepartmentId: ''
      });
    }
  }

  /**
   * Perform search on categories
   */
  searchCategories(): void {
    this.loadCategories();
  }

  /**
   * Filter categories by department
   */
  onDepartmentFilterChange(): void {
    this.loadCategories();
  }

  /**
   * Get department name by ID
   */
  getDepartmentName(departmentId: string): string {
    const department = this.departments.find(d => d.department_id === departmentId);
    return department ? department.department_name : 'Unknown Department';
  }

  /**
   * Handle page change for pagination
   * @param page Page number to navigate to
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCategories();
    }
  }
}