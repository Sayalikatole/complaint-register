import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Cl_getDepartmentPayload, DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';
import { Department, DepartmentRequest } from '../../../models/department';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent implements OnInit, OnDestroy {
  // Department form fields
  departmentId: string = '';
  departmentName: string = '';
  departmentDescription: string = '';
  departmentStatus: string = 'YES'; // Default to active

  // Search and filter
  searchTerm: string = '';

  // Departments list
  departments: Department[] = [];

  // Edit mode
  isEditMode: boolean = false;
  editingDepartmentId: string = '';

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
    private departmentService: DepartmentService,
    private authService: AuthService
  ) { }

  /**
   * Initialize the component and load initial data
   */
  ngOnInit(): void {
    // this.loadDepartments();

    // Get current user data
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments after getting user data
          this.loadDepartments();
          this.generateNewDepartmentId();
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
   * Load departments with optional search and pagination
   */
  loadDepartments(): void {
    if (!this.currentUser) return;

    // Using default org and opr ids - should be updated based on selection

    const department_data: Cl_getDepartmentPayload = {
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
   * Generate a new department ID
   */
  generateNewDepartmentId(): void {
    // this.departmentService.generateDepartmentId()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       this.departmentId = response.id;
    //     },
    //     error: (error) => {
    //       console.error('Error generating department ID:', error);
    //       this.departmentId = `DEPT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    //     }
    //   });
  }

  /**
 * Handle form submission to create or update department
 */
  onSubmit(form: any): void {
    // Form validation
    if (!this.departmentName.trim()) {
      this.errorMessage = 'Department name is required';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'User authentication required';
      return;
    }

    const departmentData: Department = {
      department_id: this.isEditMode ? this.editingDepartmentId : "",
      department_name: this.departmentName.trim(),
      description: this.departmentDescription.trim(),
      is_active: this.departmentStatus,
      org_id: this.currentUser?.organizationId || "",
      opr_id: this.currentUser?.operatingUnitId || "",
      created_by: !this.isEditMode ? this.currentUser?.userId : "",
      modified_by: this.isEditMode ? this.currentUser?.userId : ""
    };

    // If editing, update existing department
    if (this.isEditMode && this.editingDepartmentId) {
      this.updateDepartment(departmentData, form);
    } else {
      // Otherwise create new department
      this.createDepartment(departmentData, form);
    }
  }

  /**
   * Create a new department
   * @param departmentData Department data to create
   * @param form NgForm reference to reset validation state
   */
  createDepartment(departmentData: Department, form: any): void {
    this.departmentService.createDepartment(departmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Department created successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadDepartments();
            this.generateNewDepartmentId();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to create department';
          }
        },
        error: (error) => {
          console.error('Error creating department:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Update an existing department
   * @param departmentData Department data to update
   * @param form NgForm reference to reset validation state
   */
  updateDepartment(departmentData: Department, form: any): void {
    console.log(departmentData);
    this.departmentService.updateDepartment(departmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = 'Department updated successfully';
            this.clearForm(form); // Pass form reference for proper reset
            this.loadDepartments();
            this.isEditMode = false;

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update department';
          }
        },
        error: (error) => {
          console.error('Error updating department:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Set the edit mode and populate form with department data
   * @param department Department to edit
   */
  editDepartment(department: Department): void {
    this.isEditMode = true;
    this.editingDepartmentId = department.department_id;
    this.departmentId = department.department_id;
    this.departmentName = department.department_name;
    this.departmentDescription = department.description;
    this.departmentStatus = department.is_active;

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Change department status (activate/deactivate)
   * @param departmentId Department ID to update
   * @param newStatus New status value
   */
  changeDepartmentStatus(departmentId: string, newStatus: string): void {
    this.departmentService.changeDepartmentStatus(departmentId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = `Department ${newStatus === 'YES' ? 'activated' : 'deactivated'} successfully`;
            this.loadDepartments();

            // Clear success message after 3 seconds
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update department status';
          }
        },
        error: (error) => {
          console.error('Error changing department status:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
  * Clear the form and reset to add mode
  * @param form Optional NgForm to reset validation state
  */
  clearForm(form?: any): void {
    this.departmentName = '';
    this.departmentDescription = '';
    this.departmentStatus = 'YES';
    this.errorMessage = '';
    this.isEditMode = false;
    this.editingDepartmentId = '';
    this.generateNewDepartmentId();

    // Reset the form validation state if form is provided
    if (form) {
      form.resetForm({
        departmentName: '',
        departmentDescription: '',
        departmentStatus: 'YES'
      });
    }
  }

  /**
   * Perform search on departments
   */
  searchDepartments(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadDepartments();
  }

  /**
   * Handle page change for pagination
   * @param page Page number to navigate to
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadDepartments();
    }
  }
}