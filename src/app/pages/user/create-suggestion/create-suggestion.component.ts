import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Cl_createAttachmentPayload, Cl_createSuggestionwithAttachmentPayload, SuggestionService } from '../../../services/suggestion.service';
import { Cl_getDepartmentPayload, DepartmentService } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { CreateSuggestionPayload, Suggestion } from '../../../models/suggestion';

interface Department {
  department_id: string;
  department_name: string;
}

@Component({
  selector: 'app-create-suggestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-suggestion.component.html',
  styleUrls: ['./create-suggestion.component.scss']
})
export class CreateSuggestionComponent implements OnInit, OnDestroy {
  // Suggestion data
  suggestionData: CreateSuggestionPayload = {
    suggestion_id: '',
    org_id: 1,                // Default value, will be updated from user info
    subject: '',
    description: '',
    department_id: '',
    created_by: '',
    created_on: '',
    modified_on: '',
    modified_by: '',
    opr_id: 1                 // Default value, will be updated from user info
  };

  // Form state
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isEditMode: boolean = false;
  editingSuggestionId: string = '';

  role: string = '';

  // Dropdown data
  departments: Department[] = [];

  // File upload
  selectedFile: File | null = null;

  // Unsubscribe observable
  private destroy$ = new Subject<void>();
  currentUser: any;

  constructor(
    private suggestionService: SuggestionService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.setCurrentUserInfo();

    // Check if we're in edit mode (you would pass suggestion ID through route parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const suggestionId = urlParams.get('id');

    if (suggestionId) {
      this.isEditMode = true;
      this.editingSuggestionId = suggestionId;
      this.loadSuggestionDetails(suggestionId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set organization and operating unit from current user
   */
  setCurrentUserInfo(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.suggestionData.org_id = parseInt(this.currentUser.organizationId) || 1;
      this.suggestionData.opr_id = parseInt(this.currentUser.operatingUnitId) || 1;
      this.suggestionData.created_by = this.currentUser.userId;
    }
    this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';
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
   * Load suggestion details for editing
   */
  loadSuggestionDetails(suggestionId: string): void {
    // Create payload for getSuggestionById
    const getSuggestionPayload = {
      orgId: this.currentUser.organizationId,
      oprId: this.currentUser.operatingUnitId,
      id: suggestionId
    };

    this.suggestionService.getSuggestionById(getSuggestionPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suggestion) => {
          // Map the response to our form fields
          this.suggestionData = {
            suggestion_id: suggestion.suggestion_id,
            org_id: suggestion.org_id,
            subject: suggestion.subject,
            description: suggestion.description,
            department_id: suggestion.department_id || '',
            created_by: suggestion.created_by,
            created_on: suggestion.created_on,
            modified_on: suggestion.modified_on || '',
            modified_by: suggestion.modified_by || '',
            opr_id: suggestion.opr_id
          };
        },
        error: (error) => {
          console.error('Error loading suggestion details:', error);
          this.errorMessage = 'Failed to load suggestion details. Please try again.';
        }
      });
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
        this.errorMessage = `Invalid file type: ${file.name}. Please upload PDF, DOC, JPG, or PNG files.`;
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = `File size exceeds 10MB limit: ${file.name}`;
        return;
      }

      // Add file to selected file
      this.selectedFile = file;

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
  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  /**
   * Submit the suggestion form
   */
  async onSubmit(form?: NgForm): Promise<void> {
    // Validate form
    if (!this.suggestionData.subject.trim() || !this.suggestionData.description.trim()) {
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
    if (!this.suggestionData.created_by) {
      this.suggestionData.created_by = this.currentUser.userId;
    }

    if (!this.suggestionData.org_id) {
      this.suggestionData.org_id = parseInt(this.currentUser.organizationId) || 1;
    }

    if (!this.suggestionData.opr_id) {
      this.suggestionData.opr_id = parseInt(this.currentUser.operatingUnitId) || 1;
    }

    // Add timestamps
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.000`;

    if (!this.isEditMode) {
      // this.suggestionData.created_on = formattedDate;
    } else {
      // this.suggestionData.modified_on = formattedDate;
      // this.suggestionData.modified_by = this.currentUser.userId;
    }

    try {
      let suggestionResponse;

      // Create attachment object if we have a file
      let attachments: Cl_createAttachmentPayload[] = [];

      if (this.selectedFile) {
        const base64Data = await this.convertFileToBase64(this.selectedFile);
        attachments.push({
          entity_type: 'Suggestion',
          entity_id: this.isEditMode ? this.editingSuggestionId : '',
          uploaded_file_name: this.selectedFile.name,
          uploaded_by: this.currentUser.userId,
          l_encrypted_file: base64Data
        });
      }

      if (this.isEditMode && this.editingSuggestionId) {
        // Update existing suggestion
        this.suggestionData.suggestion_id = this.editingSuggestionId;

        // Create update payload with proper structure (matching complaint pattern)
        const updatePayload: Cl_createSuggestionwithAttachmentPayload = {
          suggestion: this.suggestionData as Suggestion,
          attachments: attachments
        };

        suggestionResponse = await this.updateSuggestionWithAttachmentsPromise(updatePayload);
      } else {
        // For new suggestions
        // Create suggestion with attachments in one call (matching complaint pattern)
        const createPayload: Cl_createSuggestionwithAttachmentPayload = {
          suggestion: this.suggestionData as Suggestion,
          attachments: attachments
        };

        suggestionResponse = await this.createSuggestionWithAttachmentsPromise(createPayload);
      }

      // Show success message
      this.isSubmitting = false;
      this.successMessage = this.isEditMode ? 'Suggestion updated successfully!' : 'Suggestion submitted successfully!';

      // Reset form
      if (form) this.resetForm(form);
      if (this.isEditMode) this.isEditMode = false;

      // Clear success message and navigate after 2 seconds
      setTimeout(() => {
        this.successMessage = '';
        this.router.navigate(['/', this.role, 'suggestions']);
      }, 2000);
    } catch (error: any) {
      this.isSubmitting = false;
      console.error('Error processing suggestion:', error);
      this.errorMessage = error.error?.message || 'Server error. Please try again later.';
    }
  }

  /**
   * Create suggestion with attachments in a single API call
   */
  private createSuggestionWithAttachmentsPromise(payload: Cl_createSuggestionwithAttachmentPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      this.suggestionService.createSuggestionWithAttachment(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
    });
  }
  /**
   * Create suggestion without attachment promise
   */
  // private createSuggestionPromise(payload: CreateSuggestionPayload): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.suggestionService.createSuggestion(payload)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe({
  //         next: (response) => resolve(response),
  //         error: (error) => reject(error)
  //       });
  //   });
  // }

  /**
   * Update suggestion with attachments in a single API call
   */
  private updateSuggestionWithAttachmentsPromise(payload: Cl_createSuggestionwithAttachmentPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      this.suggestionService.updateSuggestionWithAttachment(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => resolve(response),
          error: (error) => reject(error)
        });
    });
  }

  /**
   * Update suggestion without attachment promise
   */
  private updateSuggestionPromise(payload: CreateSuggestionPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      this.suggestionService.updateSuggestion(payload)
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
  resetForm(form?: NgForm): void {
    if (form) {
      form.resetForm();
    }

    // Reset to initial state
    this.suggestionData = {
      suggestion_id: '',
      org_id: this.currentUser ? parseInt(this.currentUser.organizationId) || 1 : 1,
      subject: '',
      description: '',
      department_id: '',
      created_by: this.currentUser?.userId || '',
      created_on: '',
      modified_on: '',
      modified_by: '',
      opr_id: this.currentUser ? parseInt(this.currentUser.operatingUnitId) || 1 : 1
    };

    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = false;
    this.editingSuggestionId = '';
  }
}