
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ComplaintService } from '../../../services/complaint.service';
import { Cl_getDepartmentPayload, DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { CreateComplaintPayload } from '../../../models/complaint';

interface Department {
  department_id: string;
  department_name: string;
}

// interface Category {
//   category_id: string;
//   category_name: string;
// }

// interface SubCategory {
//   sub_category_id: string;
//   sub_category_name: string;
//   category_id: string;
// }

@Component({
  selector: 'app-create-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-complaint.component.html',
  styleUrls: ['./create-complaint.component.scss']
})
export class CreateComplaintComponent implements OnInit, OnDestroy {
  // Complaint data with updated field names
  complaintData: CreateComplaintPayload = {
    complaint_id: '',
    org_id: 1,                // Default value, will be updated from user info
    subject: '',              // Changed from title
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',           // Default for new complaints
    department_id: '',
    created_by: '',
    assigned_to: '',          // Optional field
    created_on: '',
    modified_on: '',
    modified_by: '',
    due_date: '',             // Can be calculated based on priority
    is_active: 'YES',         // Default for new complaints
    opr_id: 1,                // Default value, will be updated from user info
  };

  // Form state
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isEditMode: boolean = false;
  editingComplaintId: string = '';

  // Dropdown data
  departments: Department[] = [];
  // categories: Category[] = [];
  // subCategories: SubCategory[] = [];
  // filteredSubCategories: SubCategory[] = [];

  // Due date calculation (days from today based on priority)
  dueDates = {
    'HIGH': 1,    // 1 day for high priority
    'MEDIUM': 3,  // 3 days for medium priority
    'LOW': 7      // 7 days for low priority
  };

  // File upload
  selectedFile: File | null = null;

  // Unsubscribe observable
  private destroy$ = new Subject<void>();
  currentUser: any;
  categoryService: any;

  constructor(
    private complaintService: ComplaintService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadCategories();
    this.setCurrentUserInfo();

    // Calculate default due date based on medium priority
    this.calculateDueDate('MEDIUM');

    // Check if we're in edit mode (you would pass complaint ID through route parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');

    if (complaintId) {
      this.isEditMode = true;
      this.editingComplaintId = complaintId;
      // this.loadComplaintDetails(complaintId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calculate due date based on priority
   */
  calculateDueDate(priority: 'HIGH' | 'MEDIUM' | 'LOW'): void {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this.dueDates[priority]);

    // Format as YYYY-MM-DD HH:MM:SS.sss
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const hours = String(dueDate.getHours()).padStart(2, '0');
    const minutes = String(dueDate.getMinutes()).padStart(2, '0');
    const seconds = String(dueDate.getSeconds()).padStart(2, '0');

    this.complaintData.due_date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
  }

  /**
   * Load complaint details for editing
   */
  // loadComplaintDetails(complaintId: string): void {
  //   this.complaintService.getComplaintById(complaintId)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (complaint) => {
  //         // Map the response to our form fields
  //         this.complaintData = {
  //           complaint_id: complaint.complaint_id,
  //           org_id: complaint.org_id,
  //           subject: complaint.subject,
  //           description: complaint.description,
  //           priority: complaint.priority,
  //           status: complaint.status,
  //           department_id: complaint.department_id,
  //           created_by: complaint.created_by,
  //           assigned_to: complaint.assigned_to || '',
  //           created_on: complaint.created_on,
  //           modified_on: complaint.modified_on || '',
  //           modified_by: complaint.modified_by || '',
  //           due_date: complaint.due_date || this.complaintData.due_date,
  //           is_active: complaint.is_active,
  //           opr_id: complaint.opr_id,
  //           category_id: complaint.category_id || '',
  //           sub_category_id: complaint.sub_category_id || ''
  //         };

  //         // If there's a category, filter subcategories
  //         if (this.complaintData.category_id) {
  //           // this.onCategoryChange();
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error loading complaint details:', error);
  //         this.errorMessage = 'Failed to load complaint details. Please try again.';
  //       }
  //     });
  // }

  /**
   * Set organization and operating unit from current user
   */
  setCurrentUserInfo(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.complaintData.org_id = parseInt(this.currentUser.organizationId) || 1;
      this.complaintData.opr_id = parseInt(this.currentUser.operatingUnitId) || 1;
      this.complaintData.created_by = this.currentUser.userId;
    }
  }

  /**
   * Load departments for dropdown
   */
  loadDepartments(): void {
    // Using default org and opr ids - should be updated based on selection
    const department_data: Cl_getDepartmentPayload = {
      oprId: '1',
      orgId: '1'
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
   * Load categories for dropdown
   */
  loadCategories(): void {
    // Placeholder for when you implement category service
    // this.categoryService.getCategories()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({...});
  }

  /**
   * Filter subcategories when category changes
   */
  // onCategoryChange(): void {
  //   if (this.complaintData.category_id) {
  //     this.filteredSubCategories = this.subCategories.filter(
  //       subcat => subcat.category_id === this.complaintData.category_id
  //     );
  //     this.complaintData.sub_category_id = ''; // Reset subcategory selection
  //   } else {
  //     this.filteredSubCategories = [];
  //   }
  // }

  /**
   * Handle priority change and recalculate due date
   */
  onPriorityChange(): void {
    this.calculateDueDate(this.complaintData.priority);
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Invalid file type. Please upload PDF, DOC, JPG, or PNG files.';
        input.value = '';
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 5MB limit.';
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  /**
   * Remove selected file
   */
  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  /**
   * Submit the complaint form
   */
  onSubmit(form?: NgForm): void {
    // Validate form
    if (!this.complaintData.subject.trim() || !this.complaintData.description.trim() ||
      !this.complaintData.priority || !this.complaintData.department_id) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'User authentication required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Add user info if not already present
    if (!this.complaintData.created_by) {
      this.complaintData.created_by = this.currentUser.userId;
    }

    if (!this.complaintData.org_id) {
      this.complaintData.org_id = parseInt(this.currentUser.organizationId) || 1;
    }

    if (!this.complaintData.opr_id) {
      this.complaintData.opr_id = parseInt(this.currentUser.operatingUnitId) || 1;
    }

    // Add timestamps
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.000`;

    if (!this.isEditMode) {
      this.complaintData.created_on = formattedDate;
    } else {
      this.complaintData.modified_on = formattedDate;
      this.complaintData.modified_by = this.currentUser.userId;
    }

    // If editing, update existing complaint
    if (this.isEditMode && this.editingComplaintId) {
      this.complaintData.complaint_id = this.editingComplaintId;
      this.updateComplaint(this.complaintData, form);
    } else {
      // Otherwise create new complaint
      this.createComplaint(this.complaintData, form);
    }
  }

  /**
   * Create a new complaint
   * @param complaintData Complaint data to create
   * @param form NgForm reference to reset validation state
   */
  createComplaint(complaintData: CreateComplaintPayload, form?: NgForm): void {
    console.log('Creating complaint:', complaintData);

    this.complaintService.createComplaint(complaintData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.status) {
            this.successMessage = 'Complaint submitted successfully!';

            if (form) this.resetForm(form);

            // Clear success message and navigate after 2 seconds
            setTimeout(() => {
              this.successMessage = '';
              this.router.navigate(['/user/complaints']);
            }, 2000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to submit complaint';
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating complaint:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Update an existing complaint
   * @param complaintData Complaint data to update
   * @param form NgForm reference to reset validation state
   */
  updateComplaint(complaintData: CreateComplaintPayload, form?: NgForm): void {
    console.log('Updating complaint:', complaintData);

    this.complaintService.updateComplaint(complaintData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.status) {
            this.successMessage = 'Complaint updated successfully!';

            if (form) this.resetForm(form);
            this.isEditMode = false;

            // Clear success message and navigate after 2 seconds
            setTimeout(() => {
              this.successMessage = '';
              this.router.navigate(['/user/complaints']);
            }, 2000);
          } else {
            this.errorMessage = response.statusMsg || 'Failed to update complaint';
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error updating complaint:', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Reset the form
   */
  resetForm(form: NgForm): void {
    form.resetForm();

    // Reset to initial state
    this.complaintData = {
      complaint_id: '',
      org_id: this.currentUser ? parseInt(this.currentUser.organizationId) || 1 : 1,
      subject: '',
      description: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      department_id: '',
      created_by: this.currentUser?.userId || '',
      assigned_to: '',
      created_on: '',
      modified_on: '',
      modified_by: '',
      due_date: '',
      is_active: 'YES',
      opr_id: this.currentUser ? parseInt(this.currentUser.operatingUnitId) || 1 : 1,
      category_id: '',
      sub_category_id: ''
    };

    // Recalculate the due date
    this.calculateDueDate('MEDIUM');

    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
    // this.filteredSubCategories = [];
    this.isEditMode = false;
    this.editingComplaintId = '';
  }
}