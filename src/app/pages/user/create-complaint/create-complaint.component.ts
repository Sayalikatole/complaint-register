
import { Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Cl_createAttachmentPayload, Cl_createComplaintwithAttachmentPayload, ComplaintService } from '../../../services/complaint.service';
import { Cl_getDepartmentPayload, DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { CreateComplaintPayload } from '../../../models/complaint';
import { ComplaintPriority, getPriorityDisplayName } from '../../../enums/complaint_priority';
import { ComplaintStatus, getStatusDisplayName } from '../../../enums/complaint_status';
import { Category } from '../../../models/category';
import { CategoryService } from '../../../services/category.service';
import { TagsService } from '../../../services/tags.service';
import { Tags } from '../../../models/tags';

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

  @ViewChild('tagSearchInput') tagSearchInput!: ElementRef;

  priorities = Object.values(ComplaintPriority);
  statuses = Object.values(ComplaintStatus);

  // Complaint data with updated field names
  complaintData: CreateComplaintPayload = {
    complaint_id: '',
    org_id: 1,                // Default value, will be updated from user info
    subject: '',              // Changed from title
    description: '',
    priority: '', // Use enum here
    status: ComplaintStatus.OPEN, // Use enum here
    department_id: '',
    created_by: '',
    assigned_to: '',          // Optional field
    created_on: '',
    modified_on: '',
    modified_by: '',
    due_date: '',             // Can be calculated based on priority
    is_active: 'YES',         // Default for new complaints
    opr_id: 1,                // Default value, will be updated from user info
    is_anonymous: 'NO',       // Default to not anonymous
    category_id: '',          // New field
    tag_id: '',               // New field
  };

  // Form state
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isEditMode: boolean = false;
  editingComplaintId: string = '';

  role: string = '';

  isTagDropdownOpen: boolean = false;
  selectedTags: string[] = [];
  tagSearchTerm: string = '';
  filteredTags: Tags[] = [];

  // Dropdown data
  departments: Department[] = [];
  categories: Category[] = [];
  tags: Tags[] = [];
  // subCategories: SubCategory[] = [];
  // filteredSubCategories: SubCategory[] = [];

  // Due date calculation (days from today based on priority)
  dueDates = {
    'HIGH': 1,    // 1 day for high priority
    'MEDIUM': 3,  // 3 days for medium priority
    'LOW': 7      // 7 days for low priority
  };

  // File upload
  selectedFiles: File[] = [];
  // Unsubscribe observable
  private destroy$ = new Subject<void>();
  currentUser: any;

  constructor(
    private complaintService: ComplaintService,
    private departmentService: DepartmentService,
    private categoryService: CategoryService,
    private tagService: TagsService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    // this.loadCategories();
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
    // Initialize selectedTags array
    this.selectedTags = [];
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
    this.complaintData.due_date = '';

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
    this.role = this.currentUser.l_role_name?.toLowerCase() || 'user';

  }

  /**
   * Load departments for dropdown
   */
  loadDepartments(): void {
    // Using default org and opr ids - should be updated based on selection
    const department_data: Cl_getDepartmentPayload = {
      opr_id: '1',
      org_id: '1'
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
   * Load categories by department
   */
  loadCategoriesByDepartment(departmentId: string): void {
    if (!departmentId) {
      this.categories = [];
      this.complaintData.category_id = '';
      this.tags = [];
      this.complaintData.tag_id = '';
      return;
    }

    const payload = {
      org_id: this.complaintData.org_id,
      opr_id: this.complaintData.opr_id,
      id: departmentId
    };

    this.categoryService.getCategoriesByDepartment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.categories = data;
          // Reset category and tag selection
          this.complaintData.category_id = '';
          this.tags = [];
          this.complaintData.tag_id = '';
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Failed to load categories. Please try again.';
        }
      });
  }

  /**
    * Update the loadTagsByCategory method to initialize filteredTags
    */
  loadTagsByCategory(categoryId: string): void {
    if (!categoryId) {
      this.tags = [];
      this.selectedTags = [];
      this.filteredTags = [];
      return;
    }

    const payload = {
      org_id: this.complaintData.org_id,
      opr_id: this.complaintData.opr_id,
      id: categoryId
    };

    this.tagService.getTagsByCategory(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tags = data;
          this.filteredTags = [...this.tags];
          // Reset tag selection
          this.selectedTags = [];
        },
        error: (error) => {
          console.error('Error loading tags:', error);
          this.errorMessage = 'Failed to load tags. Please try again.';
        }
      });
  }

  /**
   * Filter tags based on search term
   */
  filterTags(): void {
    if (!this.tagSearchTerm) {
      this.filteredTags = [...this.tags];
      return;
    }

    const term = this.tagSearchTerm.toLowerCase();
    this.filteredTags = this.tags.filter(tag =>
      tag.tag_name.toLowerCase().includes(term)
    );
  }


  /**
   * Toggle a tag selection
   */
  toggleTag(tagId: string): void {
    const index = this.selectedTags.indexOf(tagId);
    if (index === -1) {
      this.selectedTags.push(tagId);
    } else {
      this.selectedTags.splice(index, 1);
    }

    // Update the complaint data with comma-separated string
    this.complaintData.tag_id = this.selectedTags.join(',');
  }



  /**
   * Check if a tag is selected
   */
  isTagSelected(tagId: string): boolean {
    return this.selectedTags.includes(tagId);
  }

  /**
   * Get the tag name from its ID
   */
  getTagName(tagId: string): string {
    const tag = this.tags.find(t => t.tag_id === tagId);
    return tag ? tag.tag_name : '';
  }

  /**
   * Remove a tag from selection when clicking the (x) button
   */
  removeTag(tagId: string, event: Event): void {
    event.stopPropagation();
    const index = this.selectedTags.indexOf(tagId);
    if (index !== -1) {
      this.selectedTags.splice(index, 1);
      // Update the complaint data with comma-separated string
      this.complaintData.tag_id = this.selectedTags.join(',');
    }
  }

  /**
   * Check if all tags are selected
   */
  areAllTagsSelected(): boolean {
    return this.tags.length > 0 && this.selectedTags.length === this.tags.length;
  }

  /**
   * Toggle selection of all tags
   */
  toggleAllTags(): void {
    if (this.areAllTagsSelected()) {
      // Deselect all
      this.selectedTags = [];
    } else {
      // Select all
      this.selectedTags = this.tags.map(tag => tag.tag_id);
    }

    // Update the complaint data with comma-separated string
    this.complaintData.tag_id = this.selectedTags.join(',');
  }

  /**
   * When a tag dropdown is opened, focus the search input
   */
  onTagDropdownOpen(): void {
    this.isTagDropdownOpen = true;
    setTimeout(() => {
      if (this.tagSearchInput) {
        this.tagSearchInput.nativeElement.focus();
      }
    });
  }


  /**
   * Handle department change and load relevant categories
   */
  onDepartmentChange(): void {
    if (this.complaintData.department_id) {
      this.loadCategoriesByDepartment(this.complaintData.department_id);
    }
  }

  /**
   * Handle category change and load relevant tags
   */
  onCategoryChange(): void {
    if (this.complaintData.category_id) {
      this.loadTagsByCategory(this.complaintData.category_id);
    }
  }

  /**
   * Handle anonymous checkbox change
   */
  onAnonymousChange(event: any): void {
    this.complaintData.is_anonymous = event.target.checked ? 'YES' : 'NO';
  }

  /**
   * Handle priority change and recalculate due date
   */
  onPriorityChange(): void {
    // this.calculateDueDate(this.complaintData.priority);
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log(event);

    if (input.files && input.files.length) {
      // Loop through all selected files
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          this.errorMessage = `Invalid file type: ${file.name}. Please upload PDF, DOC, JPG, or PNG files.`;
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = `File size exceeds 5MB limit: ${file.name}`;
          continue;
        }

        // Add file to selected files array
        this.selectedFiles.push(file);
      }

      // Clear input value to allow selecting the same file again
      input.value = '';
    }
  }

  /**
   * Convert file to Base64
   */
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // The result includes the data URL prefix (e.g., "data:application/pdf;base64,")
        // We need to remove this prefix to get just the Base64 string
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Remove selected file
   */
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
 * Submit the complaint form
 */
  async onSubmit(form?: NgForm): Promise<void> {
    // Validate form
    // if (!this.complaintData.subject.trim() || !this.complaintData.description.trim() ||
    //   !this.complaintData.priority || !this.complaintData.department_id) {
    //   this.errorMessage = 'Please fill all required fields.';
    //   return;
    // }

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

    try {
      let complaintResponse;

      this.complaintData.tag_id = this.selectedTags.length > 0 ? this.selectedTags.join(',') : '';


      // Process files and create attachment array
      const attachmentPromises = this.selectedFiles.map(async file => {
        const base64Data = await this.convertFileToBase64(file);
        return {
          entity_type: 'Complaint',
          entity_id: this.isEditMode ? this.editingComplaintId : '',  // Will be updated after complaint creation
          uploaded_file_name: file.name,
          uploaded_by: this.currentUser.userId,
          l_encrypted_file: base64Data
        } as Cl_createAttachmentPayload;
      });

      // Wait for all file conversions to complete
      const attachments = await Promise.all(attachmentPromises);

      if (this.isEditMode && this.editingComplaintId) {
        // Update existing complaint with attachments
        this.complaintData.complaint_id = this.editingComplaintId;

        complaintResponse = await this.updateComplaintWithAttachmentsPromise(this.complaintData);
      } else {
        // For new complaints
        if (attachments.length > 0) {
          // Create complaint with attachments in one call
          const createPayload: Cl_createComplaintwithAttachmentPayload = {
            complaint: this.complaintData as any, // Cast to Complaint
            attachments: attachments
          };

          complaintResponse = await this.createComplaintWithAttachmentsPromise(createPayload);
        } else {
          // Create complaint with attachments in one call
          const createPayload: Cl_createComplaintwithAttachmentPayload = {
            complaint: this.complaintData as any, // Cast to Complaint
            attachments: []
          };
          console.log('createPayload', createPayload);
          // No attachments, just create the complaint
          complaintResponse = await this.createComplaintWithAttachmentsPromise(createPayload);
        }
      }

      // Show success message
      this.isSubmitting = false;
      this.successMessage = this.isEditMode ? 'Complaint updated successfully!' : 'Complaint submitted successfully!';

      if (form) this.resetForm(form);
      if (this.isEditMode) this.isEditMode = false;

      // Clear success message and navigate after 2 seconds
      setTimeout(() => {
        this.successMessage = '';
        this.router.navigate(['/', this.role, 'complaints']);
      }, 2000);
    } catch (error: any) {
      this.isSubmitting = false;
      console.error('Error processing complaint:', error);
      this.errorMessage = error.error?.message || 'Server error. Please try again later.';
    }
  }

  /**
   * Create complaint with attachments in a single API call
   */
  private createComplaintWithAttachmentsPromise(payload: Cl_createComplaintwithAttachmentPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      this.complaintService.createComplaintWithAttachments(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
    });
  }

  /**
   * Update complaint with attachments in a single API call
   */
  private updateComplaintWithAttachmentsPromise(payload: CreateComplaintPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      this.complaintService.updateComplaint(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
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
      priority: '', // Use enum here
      status: ComplaintStatus.OPEN, // Use enum here
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
      sub_category_id: '',
      is_anonymous: 'NO', // Reset to not anonymous
      tag_id: ''
    };

    // Recalculate the due date
    this.calculateDueDate('MEDIUM');

    this.selectedFiles = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.categories = [];
    this.tags = [];
    this.filteredTags = [];
    this.selectedTags = [];
    this.tagSearchTerm = '';
    this.isEditMode = false;
    this.editingComplaintId = '';
  }

  /**
 * Handle document clicks to close the dropdown when clicking outside
 */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // Check if the click is outside the tags dropdown
    if (this.isTagDropdownOpen) {
      const clickedElement = event.target as HTMLElement;
      const dropdown = document.querySelector('.tag-dropdown-container');
      if (dropdown && !dropdown.contains(clickedElement)) {
        this.isTagDropdownOpen = false;
      }
    }
  }


  // You can use getPriorityDisplayName helper function to display user-friendly names
  getPriorityDisplay(priority: string): string {
    return getPriorityDisplayName(priority);
  }

  getStatusDisplay(status: string): string {
    return getStatusDisplayName(status);
  }
}
