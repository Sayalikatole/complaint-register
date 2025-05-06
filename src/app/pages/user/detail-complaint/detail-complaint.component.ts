import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Cl_createComplaintwithAttachmentPayload, Cl_getAttachmentPayload, Cl_getComplaintHistoryPayload, Cl_getUserComplaintPayload, ComplaintService, GetChatMessagesPayload, SendChatMessagePayload } from '../../../services/complaint.service';
import { Attachment, ChatMessage, Cl_createAttachmentPayload, Complaint, ComplaintHistoryItem, FeedbackData } from '../../../models/complaint';
import { AuthService, Cl_getAssignableUsers } from '../../../services/auth.service';
import { UserByDepartment, UserData } from '../../../models/auth';
import { ComplaintStatus } from '../../../enums/complaint_status';

@Component({
  selector: 'app-detail-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './detail-complaint.component.html',
  styleUrls: ['./detail-complaint.component.scss']
})
export class DetailComplaintComponent implements OnInit, OnDestroy {
  complaint: Complaint | null = null;
  loading: boolean = true;
  error: string | null = null;
  replyText: string = '';

  // For feedback response (admin/HOD feature)
  feedbackResponse: string = '';
  canRespondToFeedback: boolean = false;
  submittingResponse: boolean = false;

  // For sending reminders
  canSendReminder: boolean = false;
  sendingReminder: boolean = false;

  // Update the activeTab type to include 'feedback'
  activeTab: 'conversation' | 'attachments' | 'history' | 'feedback' = 'conversation'; submittingReply: boolean = false;
  currentUser: UserData | null = null;

  role: string = '';

  // Add these properties to your class
  showDueDatePicker: boolean = false;
  updatingDueDate: boolean = false;
  selectedDueDate: string = '';  // Will be in format YYYY-MM-DD
  selectedDueTime: string = '';  // Will be in format HH:MM
  canUpdateDueDate: boolean = false;

  // Form state
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isEditMode: boolean = false;
  editingComplaintId: string = '';

  // Add these properties to your class
  showAssigneeDropdown: boolean = false;
  assigneeSearchTerm: string = '';
  assignees: UserByDepartment[] = []; // Will hold the users from API
  loadingAssignees: boolean = false;
  canUpdateAssignee: boolean = false;

  // Add these properties
  showStatusDropdown: boolean = false;
  canChangeStatus: boolean = false;

  // Add these properties for attachments
  attachments: Attachment[] = [];
  loadingAttachments: boolean = false;
  attachmentError: string | null = null;

  // Add to your component properties
  historyItems: ComplaintHistoryItem[] = [];
  loadingHistory: boolean = false;
  historyError: string | null = null;

  // Add these properties for feedback
  feedback: FeedbackData | null = null;
  loadingFeedback: boolean = false;
  feedbackError: string | null = null;
  hasFeedback: boolean = false;
  messages: ChatMessage[] = [];
  loadingMessages: boolean = false;
  messageError: string | null = null;

  // For tracking subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complaintService: ComplaintService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        console.log(this.currentUser)
        this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';

        // Check if user can update assignees (admin, manager, or HOD)
        this.canUpdateAssignee = ['admin', 'hod'].includes(this.role);

        if (user) {
          // Load departments after getting user data
          this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const id = params['id'];
            if (id) {
              this.loadComplaintDetails(id);
              this.loadComplaintHistory(id); // Add this line
              this.loadMessages(id); // Add this line
              this.setupDueDateEditPermission();
              this.loadFeedback(id)
            }
          });
        }
      });


    // Add this to your existing ngOnInit
    // Determine if user can change status (HOD or employee)
    this.canChangeStatus = this.currentUser?.l_role_name?.toLowerCase() === 'hod' ||
      this.currentUser?.l_role_name?.toLowerCase() === 'employee';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadComplaintDetails(id: string): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.error = null;

    const userComplaint_data: Cl_getUserComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: id
    };

    this.complaintService.getComplaintById(userComplaint_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaint = data;
          this.loading = false;

          // After loading complaint details, load attachments
          this.loadAttachments(id);
          this.setupDueDateEditPermission();

          // Check if complaint is closed, then check for feedback
          if (this.complaint.status?.toUpperCase() === 'CLOSED') {
            this.checkFeedbackExists(id);
          }
        },
        error: (err) => {
          console.error('Error loading complaint details:', err);
          this.error = 'Failed to load complaint details. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Check if feedback exists for this complaint
   */
  checkFeedbackExists(complaintId: string): void {
    if (!this.currentUser) return;

    const payload = {
      complaint_id: complaintId,
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId
    };

    this.complaintService.checkFeedbackExists(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          this.hasFeedback = exists;
        },
        error: (error) => {
          console.error('Error checking feedback existence:', error);
          this.hasFeedback = false;
        }
      });
  }

  /**
 * Load complaint history
 */
  loadComplaintHistory(complaintId: string): void {
    if (!this.currentUser) return;
    this.loadingHistory = true;
    this.historyError = null;

    const historyPayload: Cl_getComplaintHistoryPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: complaintId
    };

    this.complaintService.getComplaintHistory(historyPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Sort history items from newest to oldest
          this.historyItems = data.sort((a, b) =>
            new Date(b.changed_on).getTime() - new Date(a.changed_on).getTime()
          );
          this.loadingHistory = false;
        },
        error: (error) => {
          console.error('Error loading complaint history:', error);
          this.historyError = 'Failed to load history. Please try again.';
          this.loadingHistory = false;
        }
      });
  }

  /**
 * Load chat messages for the complaint
 */
  loadMessages(complaintId?: string): void {
    const id = complaintId || this.complaint?.complaint_id;
    if (!id) return;

    this.loadingMessages = true;
    this.messageError = null;

    const payload: GetChatMessagesPayload = {
      id: id
    };

    this.complaintService.getChatMessages(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages.sort((a, b) =>
            new Date(a.sent_on || 0).getTime() - new Date(b.sent_on || 0).getTime()
          );
          this.loadingMessages = false;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.messageError = 'Failed to load conversation history';
          this.loadingMessages = false;
          this.messages = [];

        }
      });
  }

  /**
   * Submit a reply/comment to the complaint
   */
  submitReply(): void {
    if (!this.replyText || !this.complaint?.complaint_id || !this.currentUser?.userId) return;

    this.submittingReply = true;

    // Determine who to send the message to
    // In most cases, this would be the complaint creator or the assignee
    let receiverId = this.complaint.created_by;

    // If the current user is the creator, send to the assignee instead
    if (this.currentUser.userId === this.complaint.created_by && this.complaint.assigned_to) {
      receiverId = this.complaint.assigned_to;
    }

    const payload: SendChatMessagePayload = {
      complaintId: this.complaint.complaint_id,
      senderId: this.currentUser.userId,
      receiverId: receiverId,
      message: this.replyText
    };

    this.complaintService.sendChatMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add the new message to the list
          const newMessage: ChatMessage = {
            complaint_id: this.complaint?.complaint_id || '',
            sender_id: this.currentUser?.userId || '',
            receiver_id: receiverId,
            message: this.replyText,
            sent_on: new Date().toISOString(),
            sender_name: this.currentUser?.username || this.currentUser?.userId || '',
            is_read: false
          };

          this.messages.push(newMessage);
          this.replyText = '';
          this.submittingReply = false;

          // Scroll to the bottom to show the new message
          setTimeout(() => {
            const messagesContainer = document.querySelector('.messages-container');
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }, 100);
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.submittingReply = false;
          this.messageError = 'Failed to send message. Please try again.';

          // Clear error after 3 seconds
          setTimeout(() => {
            this.messageError = null;
          }, 3000);
        }
      });
  }

  /**
   * Cancel reply and clear the text
   */
  cancelReply(): void {
    this.replyText = '';
  }

  /**
   * Load attachments for this complaint
   */
  loadAttachments(complaintId: string): void {
    this.loadingAttachments = true;
    this.attachmentError = null;

    console.log('Loading attachments for complaint ID:', complaintId);
    const attachmentPayload: Cl_getAttachmentPayload = {
      id: complaintId,
      entity_type: 'Complaint' // Note: using uppercase as shown in your example
    };

    this.complaintService.getAttachment(attachmentPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response)) {
            // Data is directly returned as an array
            this.attachments = response;
            console.log('Attachments loaded:', this.attachments);
          }
          //  else if (response && response.status && Array.isArray(response.data)) {
          //   // Data is nested in a response object with status
          //   this.attachments = response.data;
          //   console.log('Attachments loaded:', this.attachments);
          // }
          else {
            this.attachmentError = 'Failed to load attachments - Invalid response format';
            this.attachments = [];
          }
          this.loadingAttachments = false;
        },
        error: (error) => {
          console.error('Error loading attachments:', error);
          this.attachmentError = 'Error loading attachments. Please try again.';
          this.attachments = [];
          this.loadingAttachments = false;
        }
      });
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'fa-file-image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fa-file-archive';
      case 'txt':
        return 'fa-file-alt';
      default:
        return 'fa-file';
    }
  }

  /**
   * Get file size display
   */
  getFileSizeDisplay(size: number): string {
    if (!size) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let sizeValue = size;
    let unitIndex = 0;

    while (sizeValue >= 1024 && unitIndex < units.length - 1) {
      sizeValue /= 1024;
      unitIndex++;
    }

    return `${sizeValue.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
 * Determine if the current user can edit the due date
 */
  setupDueDateEditPermission(): void {
    // Only allow editing due date if:
    // 1. User is HOD of the department the complaint is assigned to
    // 2. User is the assigned employee

    console.log('Setting up due date edit permission...');
    // First, check if there is a current user
    if (!this.currentUser) {
      this.canUpdateDueDate = false;
      return;
    }


    // Get current user role and ID
    const userRole = this.currentUser.l_role_name?.toUpperCase();
    const userId = this.currentUser.userId;

    console.log(this.complaint);
    // Check if complaint exists
    if (!this.complaint) {
      this.canUpdateDueDate = false;
      return;
    }
    console.log('fcgcdtwgef duyab');

    // HOD permission check
    const isHOD = userRole === 'HOD';
    const isForHODDepartment = this.complaint.department_id === this.currentUser.department_id;

    // Assigned employee check
    const isAssignedEmployee = this.complaint.assigned_to === userId;

    // Set permission based on conditions
    this.canUpdateDueDate = (isHOD) || isAssignedEmployee;
    console.log(this.updateComplaintStatus, isHOD, isForHODDepartment)
  }

  /**
   * Toggle the due date picker
   */
  toggleDueDatePicker(event: Event): void {
    event.stopPropagation();

    this.showDueDatePicker = !this.showDueDatePicker;

    if (this.showDueDatePicker) {
      // Initialize the date picker with current due date
      if (this.complaint?.due_date) {
        const dueDate = new Date(this.complaint.due_date);

        // Format date as YYYY-MM-DD for the date input
        this.selectedDueDate = dueDate.toISOString().split('T')[0];

        // Format time as HH:MM for the time input
        const hours = String(dueDate.getHours()).padStart(2, '0');
        const minutes = String(dueDate.getMinutes()).padStart(2, '0');
        this.selectedDueTime = `${hours}:${minutes}`;
      } else {
        // Set default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.selectedDueDate = tomorrow.toISOString().split('T')[0];
        this.selectedDueTime = '17:00'; // Default to 5 PM
      }
    }
  }

  /**
   * Close the date picker dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close due date picker
    if (this.showDueDatePicker) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu') && !target.closest('button')) {
        this.showDueDatePicker = false;
      }
    }

    // Existing code for other dropdowns...
  }

  /**
   * Get today's date in YYYY-MM-DD format for min attribute
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Set due date based on preset values (days from today)
   */
  setDueDatePreset(days: number): void {
    const date = new Date();
    date.setDate(date.getDate() + days);

    // Update the date input
    this.selectedDueDate = date.toISOString().split('T')[0];

    // Keep the current time or set to end of day
    if (!this.selectedDueTime) {
      this.selectedDueTime = '17:00'; // 5 PM
    }
  }

  /**
   * Cancel due date change
   */
  cancelDueDateChange(): void {
    this.showDueDatePicker = false;
  }

  /**
   * Update the due date
   */
  updateDueDate(): void {
    if (!this.complaint || !this.selectedDueDate) return;

    this.updatingDueDate = true;

    // Set default time if none selected
    const timeToUse = this.selectedDueTime || '17:00';

    // Combine date and time to create a complete timestamp
    const [year, month, day] = this.selectedDueDate.split('-');
    const [hours, minutes] = timeToUse.split(':');

    // Format as YYYY-MM-DD HH:MM:SS.sss
    const formattedDueDate = `${year}-${month}-${day} ${hours}:${minutes}:00.000`;

    // Create updated complaint object
    const updatedComplaint = {
      ...this.complaint,
      due_date: formattedDueDate,
      l_previous_status: this.complaint.status,
    };

    // Create the proper payload structure (with empty attachments array)
    const payload: Cl_createComplaintwithAttachmentPayload = {
      complaint: updatedComplaint,
      attachments: []
    };

    // Call API to update due date
    this.complaintService.updateComplaint(updatedComplaint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status) {
            // Refresh the complaint data to get updated fields
            this.loadComplaintDetails(this.complaint?.complaint_id || '');

            // Show a success message
            this.successMessage = 'Due date updated successfully!';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = response?.statusMsg || 'Failed to update due date';
          }
          this.updatingDueDate = false;
          this.showDueDatePicker = false;
        },
        error: (error) => {
          console.error('Error updating due date:', error);
          this.errorMessage = 'An error occurred while updating the due date';
          this.updatingDueDate = false;
          this.showDueDatePicker = false;

          // Clear error after 3 seconds
          setTimeout(() => {
            // this.errorMessage = null;
          }, 3000);
        }
      });
  }

  /**
  * Download attachment with proper error handling
  */
  downloadAttachment(attachment: Attachment): void {
    if (!attachment) return;

    // Show loading indicator
    this.loadingAttachments = true;

    try {
      // Check if we have base64 data to work with
      if (attachment.l_encrypted_file) {
        // Process the base64 data and download it
        this.downloadBase64File(
          attachment.l_encrypted_file,
          attachment.uploaded_file_name
        );

        // Clear loading state after a short delay
        setTimeout(() => {
          this.loadingAttachments = false;
        }, 500);
      } else {
        throw new Error('No file data available');
      }
    } catch (error) {
      console.error('Error initiating download:', error);
      this.loadingAttachments = false;
      this.attachmentError = 'Failed to download file. Please try again.';

      // Clear error after 3 seconds
      setTimeout(() => {
        this.attachmentError = null;
      }, 3000);
    }
  }

  /**
 * Check if a file is viewable in the browser based on its extension
 */
  isFileViewable(filename: string): boolean {
    if (!filename) return false;
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(extension);
  }

  /**
   * View attachment in browser when possible
   */
  viewAttachment(attachment: Attachment): void {
    if (!attachment) return;

    const extension = attachment.uploaded_file_name.split('.').pop()?.toLowerCase();
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];

    try {
      // Set loading state
      this.loadingAttachments = true;

      if (viewableTypes.includes(extension || '')) {
        // Handle text files specially
        if (extension === 'txt' && attachment.l_encrypted_file) {
          try {
            const decodedText = atob(attachment.l_encrypted_file);
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>${attachment.uploaded_file_name}</title>
                <style>
                  body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
                </style>
              </head>
              <body>${decodedText}</body>
              </html>
            `);
              newWindow.document.close();
            }
            this.loadingAttachments = false;
            return;
          } catch (e) {
            console.error('Error viewing text file:', e);
            // Fall through to standard base64 handling
          }
        }

        // For all other viewable types (images, PDFs)
        if (attachment.l_encrypted_file) {
          // Remove potential URL prefix in base64 data
          let cleanBase64 = attachment.l_encrypted_file;
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }

          // Create blob from base64 data
          const byteCharacters = atob(cleanBase64);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          // Determine mime type
          let mimeType = 'application/octet-stream';
          switch (extension) {
            case 'pdf': mimeType = 'application/pdf'; break;
            case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
            case 'png': mimeType = 'image/png'; break;
            case 'gif': mimeType = 'image/gif'; break;
            case 'txt': mimeType = 'text/plain'; break;
          }

          const blob = new Blob(byteArrays, { type: mimeType });
          const url = URL.createObjectURL(blob);

          // Open in new tab
          window.open(url, '_blank');

          // Clean up
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.loadingAttachments = false;
        } else {
          throw new Error('No file data available for viewing');
        }
      } else {
        // For non-viewable types, just download
        this.downloadAttachment(attachment);
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      this.loadingAttachments = false;
      this.attachmentError = 'Unable to view this file. Downloading instead...';

      // Attempt to download instead
      setTimeout(() => {
        this.attachmentError = null;
        this.downloadAttachment(attachment);
      }, 1500);
    }
  }

  /**
   * Download base64 encoded file
   */
  private downloadBase64File(base64Data: string, filename: string): void {
    try {
      // Remove potential URL prefix in base64 data
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }

      // Create blob from base64
      const byteCharacters = atob(cleanBase64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      // Determine mime type based on file extension
      let mimeType = 'application/octet-stream'; // Default
      const extension = filename.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'pdf': mimeType = 'application/pdf'; break;
        case 'doc': case 'docx': mimeType = 'application/msword'; break;
        case 'xls': case 'xlsx': mimeType = 'application/vnd.ms-excel'; break;
        case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
        case 'png': mimeType = 'image/png'; break;
        case 'gif': mimeType = 'image/gif'; break;
        case 'txt': mimeType = 'text/plain'; break;
      }

      const blob = new Blob(byteArrays, { type: mimeType });

      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. The file might be corrupted or in an unsupported format.');
    }
  }

  /**
   * View attachment (for viewable types like images and PDFs)
   */
  // viewAttachment(attachment: Attachment): void {
  //   const extension = attachment.uploaded_file_name.split('.').pop()?.toLowerCase();
  //   const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];

  //   if (viewableTypes.includes(extension || '')) {
  //     if (attachment.file_url) {
  //       window.open(attachment.file_url, '_blank');
  //     } else if (attachment.l_encrypted_file) {
  //       // Create blob from base64 data
  //       const byteCharacters = atob(attachment.l_encrypted_file);
  //       const byteArrays = [];

  //       for (let offset = 0; offset < byteCharacters.length; offset += 512) {
  //         const slice = byteCharacters.slice(offset, offset + 512);
  //         const byteNumbers = new Array(slice.length);
  //         for (let i = 0; i < slice.length; i++) {
  //           byteNumbers[i] = slice.charCodeAt(i);
  //         }
  //         const byteArray = new Uint8Array(byteNumbers);
  //         byteArrays.push(byteArray);
  //       }

  //       // Determine mime type
  //       let mimeType = 'application/octet-stream';
  //       switch (extension) {
  //         case 'pdf': mimeType = 'application/pdf'; break;
  //         case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
  //         case 'png': mimeType = 'image/png'; break;
  //         case 'gif': mimeType = 'image/gif'; break;
  //       }

  //       const blob = new Blob(byteArrays, { type: mimeType });
  //       const url = URL.createObjectURL(blob);

  //       // Open in new tab
  //       window.open(url, '_blank');

  //       // Clean up
  //       setTimeout(() => URL.revokeObjectURL(url), 1000);
  //     }
  //   } else {
  //     // For non-viewable types, just download
  //     this.downloadAttachment(attachment);
  //   }
  // }

  /**
   * Change the active tab
   */
  // setActiveTab(tab: 'conversation' | 'attachments' | 'history'): void {
  //   this.activeTab = tab;
  // }

  /**
   * Submit a reply/comment to the complaint
   */
  // submitReply(): void {
  //   if (!this.replyText || !this.complaint?.complaint_id) return;

  //   this.submittingReply = true;

  //   this.complaintService.addComment(this.complaint.complaint_id, this.replyText)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         // Update the complaint with the new comment
  //         if (this.complaint && response) {
  //           // Ideally, refresh the whole complaint or add the comment to the list
  //           this.loadComplaintDetails(this.complaint.complaint_id);
  //         }
  //         this.replyText = '';
  //         this.submittingReply = false;
  //       },
  //       error: (err) => {
  //         console.error('Error adding comment:', err);
  //         this.submittingReply = false;
  //         // Display error message
  //         this.error = 'Failed to add comment. Please try again.';
  //       }
  //     });
  // }

  /**
 * Get status color class for timeline
 */
  getStatusColorClass(status: string): string {
    switch (status.toUpperCase()) {
      case ComplaintStatus.OPEN:
        return 'bg-gray-500';
      case ComplaintStatus.ASSIGNED:
        return 'bg-yellow-500';
      case ComplaintStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-500';
      case ComplaintStatus.CLOSED:
        return 'bg-red-500';
      case ComplaintStatus.ESCALATED:
        return 'bg-purple-500';
      case ComplaintStatus.DEFERRED:
        return 'bg-orange-500';
      case ComplaintStatus.REOPEN:
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  }


  /**
 * Get background color class for status timeline dots
 */
  getStatusBackgroundClass(status: string): string {
    switch (status?.toUpperCase()) {
      case ComplaintStatus.OPEN:
        return 'bg-blue-500';
      case ComplaintStatus.ASSIGNED:
        return 'bg-yellow-500';
      case ComplaintStatus.IN_PROGRESS:
        return 'bg-indigo-500';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-500';
      case ComplaintStatus.CLOSED:
        return 'bg-red-500';
      case ComplaintStatus.ESCALATED:
        return 'bg-purple-500';
      case ComplaintStatus.DEFERRED:
        return 'bg-orange-500';
      case ComplaintStatus.REOPEN:
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Get user-friendly display name for a status
   */
  // getStatusDisplay(status: string): string {
  //   return getStatusDisplayName(status || 'Not Set');
  // }

  /**
   * Get user name from user ID
   * Note: This is a placeholder - you may want to implement a proper lookup
   */
  getUserName(userId: string): string {
    // You can implement a proper user lookup here
    // For now, just return the user ID
    return userId || 'System';
  }

  /**
   * Get the status badge color class
   */
  getStatusBadgeClass(status: string): string {
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
   * Get the priority indicator color class
   */
  getPriorityColorClass(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  }

  /**
   * Format date in a consistent way
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string | undefined): string {
    if (!name) return 'UN';

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return (name.substring(0, 2)).toUpperCase();
  }

  /**
   * Extract filename from attachment URL
   */
  getFilenameFromUrl(url: string): string {
    if (!url) return 'Unknown file';

    // Try to extract filename from the URL
    const parts = url.split('/');
    let filename = parts[parts.length - 1];

    // Remove any query parameters
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    // Decode URI components if needed
    try {
      return decodeURIComponent(filename);
    } catch (e) {
      return filename;
    }
  }

  /**
   * Navigate back to complaints list
   */
  goBack(): void {
    // this.router.navigate(['/user/complaints']);
    this.router.navigate(['/', this.role, 'complaints']);
  }





  // Add a computed property for filtered assignees
  get filteredAssignees(): UserByDepartment[] {
    if (!this.assigneeSearchTerm || this.assigneeSearchTerm.trim() === '') {
      return this.assignees;
    }

    const term = this.assigneeSearchTerm.toLowerCase().trim();
    return this.assignees.filter(user =>
      user.name.toLowerCase().includes(term) ||
      (user.department_id && user.department_id.toLowerCase().includes(term)) ||
      (user.role_id && user.role_id.toLowerCase().includes(term))
    );
  }

  /**
   * Toggle the assignee dropdown
   */
  toggleAssigneeDropdown(event: Event): void {
    event.stopPropagation();
    this.showAssigneeDropdown = !this.showAssigneeDropdown;

    // Load assignees if opening the dropdown and they haven't been loaded yet
    if (this.showAssigneeDropdown && this.assignees.length === 0) {
      this.loadAssignees();
    }
  }

  /**
   * Load assignees from API
   */
  loadAssignees(): void {
    if (!this.currentUser) return;

    this.loadingAssignees = true;

    const getAssignableUsers_payload: Cl_getAssignableUsers = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.department_id
    };
    // Replace with your actual API call to get users
    this.authService.getAssignableUsers(getAssignableUsers_payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          // Map the account_id to userId for each user
          this.assignees = users.map(user => ({
            ...user,
            userId: user.account_id  // Map account_id to userId
          }));

          console.log('Assignees after mapping:', this.assignees);
          this.loadingAssignees = false;
        },
        error: (err) => {
          console.error('Error loading assignees:', err);
          this.loadingAssignees = false;
        }
      });
  }

  /**
   * Select an assignee
   */
  selectAssignee(user: any | null): void {
    if (!this.complaint) return;

    console.log('Selected user:', user);
    const userId = user ? user.userId : null;
    const userName = user ? user.userName : null;

    // Close dropdown
    this.showAssigneeDropdown = false;

    // If the selected user is the same as current assignee, do nothing
    console.log(userId, this.complaint.assigned_to)

    if ((userId === this.complaint.assigned_to)) {
      console.log(userId, this.complaint.assigned_to)
      return;
    }

    // Show loading
    this.loading = true;

    // Call API to update assignee
    console.log('Updating complaint:', this.complaint);

    this.complaint.assigned_to = userId;
    this.complaint.l_assigned_to = userName;
    console.log('Selected assignee:', userId);
    // Create update payload
    const updatedComplaint = {
      ...this.complaint,
      l_previous_status: this.complaint.status,
      l_assigned_to: userName,
      status: ComplaintStatus.ASSIGNED,
      // modified_by: this.currentUser?.userId,
      // modified_on: new Date().toISOString() // Backend should handle proper date formatting
    };
    this.complaintService.updateComplaint(updatedComplaint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // this.isSubmitting = false;
          if (response.status) {
            this.successMessage = 'Complaint updated successfully!';

            // if (form) this.resetForm(form);
            // this.isEditMode = false;

            // Clear success message and navigate after 2 seconds
            setTimeout(() => {
              this.successMessage = '';
              // this.router.navigate(['/user/complaints']);
              this.router.navigate(['/', this.role, 'complaints']);

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
  * Toggle the status dropdown
  */
  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.showStatusDropdown = !this.showStatusDropdown;

    // Close assignee dropdown if open
    if (this.showStatusDropdown && this.showAssigneeDropdown) {
      this.showAssigneeDropdown = false;
    }
  }

  /**
 * Display status in a user-friendly way
 */
  getStatusDisplay(status: string): string {
    return getStatusDisplayName(status || 'Not set');
  }

  /**
  * Get allowed status transitions based on current status
  */
  getAllowedStatusTransitions(currentStatus: string): string[] {
    const status = currentStatus?.toUpperCase();

    // Define valid transitions for each status
    switch (status) {
      case ComplaintStatus.OPEN:
        return [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS];

      case ComplaintStatus.ASSIGNED:
        return [ComplaintStatus.IN_PROGRESS, ComplaintStatus.DEFERRED];

      case ComplaintStatus.IN_PROGRESS:
        return [ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED, ComplaintStatus.DEFERRED];

      case ComplaintStatus.RESOLVED:
        return [ComplaintStatus.CLOSED, ComplaintStatus.REOPEN];

      case ComplaintStatus.REOPEN:
        return [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ASSIGNED];

      case ComplaintStatus.ESCALATED:
        return [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED];

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
  updateComplaintStatus(newStatus: string): void {
    if (!this.complaint) return;

    // Close dropdown
    this.showStatusDropdown = false;

    // Skip if status didn't change
    if (this.complaint.status?.toUpperCase() === newStatus.toUpperCase()) {
      return;
    }

    // Create update payload
    const updatedComplaint = {
      ...this.complaint,
      status: newStatus,
      modified_by: this.currentUser?.userId,
      modified_on: new Date().toISOString()
    };

    // Show loading state
    this.loading = true;

    // Call API to update status
    this.complaintService.updateComplaint(updatedComplaint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.status) {
            // Update local complaint status
            // this.complaint.status = newStatus;
            // this.complaint.modified_by = this.currentUser?.userId || '';
            // this.complaint.modified_on = new Date().toISOString();

            // Refresh the complaint data to get updated fields
            this.loadComplaintDetails(this.complaint?.complaint_id || '');
          } else {
            this.error = response?.statusMsg || 'Failed to update status';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.error = 'An error occurred while updating status';
          this.loading = false;
        }
      });
  }


  /**
 * Load feedback for this complaint
 */
  loadFeedback(complaintId: string): void {
    if (!this.currentUser) return;

    this.loadingFeedback = true;
    this.feedbackError = null;

    const payload = {
      id: complaintId,
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId
    };

    this.complaintService.getFeedbackByComplaintId(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (feedbackData) => {
          this.feedback = feedbackData;
          this.hasFeedback = !!feedbackData;
          this.loadingFeedback = false;
          console.log(this.feedback)

          // Check if user can respond to feedback
          this.canRespondToFeedback = this.role === 'admin' || this.role === 'hod';

          // Check if user can send reminders
          this.canSendReminder = !this.hasFeedback &&
            (this.role === 'admin' || this.role === 'hod' ||
              this.complaint?.assigned_to === this.currentUser?.userId);
        },
        error: (error) => {
          console.error('Error loading feedback:', error);
          this.feedbackError = 'Failed to load feedback. Please try again.';
          this.loadingFeedback = false;
        }
      });
  }

  /**
   * Submit response to feedback (admin/HOD feature)
   */
  submitFeedbackResponse(): void {
    // if (!this.feedback || !this.feedbackResponse.trim()) return;

    // this.submittingResponse = true;

    // // Create the response payload
    // const responsePayload = {
    //   feedback_id: this.feedback.feedback_id,
    //   response_text: this.feedbackResponse,
    //   responder_id: this.currentUser?.userId
    // };

    // // Call service method (you would need to implement this)
    // this.complaintService.respondToFeedback(responsePayload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       if (response && response.status) {
    //         // Show success message
    //         this.successMessage = 'Response submitted successfully';

    //         // Refresh feedback
    //         this.loadFeedback(this.complaint?.complaint_id || '');

    //         // Clear response text
    //         this.feedbackResponse = '';
    //       } else {
    //         this.errorMessage = response?.statusMsg || 'Failed to submit response';
    //       }
    //       this.submittingResponse = false;
    //     },
    //     error: (error) => {
    //       console.error('Error submitting response:', error);
    //       this.errorMessage = 'An error occurred while submitting response';
    //       this.submittingResponse = false;
    //     }
    //   });
  }

  /**
   * Send reminder for feedback (admin/HOD/assigned employee feature)
   */
  sendFeedbackReminder(): void {
    // if (!this.complaint) return;

    // this.sendingReminder = true;

    // // Create the reminder payload
    // const reminderPayload = {
    //   complaint_id: this.complaint.complaint_id,
    //   sender_id: this.currentUser?.userId,
    //   recipient_id: this.complaint.created_by
    // };

    // // Call service method (you would need to implement this)
    // this.complaintService.sendFeedbackReminder(reminderPayload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       if (response && response.status) {
    //         // Show success message
    //         this.successMessage = 'Feedback reminder sent successfully';
    //       } else {
    //         this.errorMessage = response?.statusMsg || 'Failed to send reminder';
    //       }
    //       this.sendingReminder = false;
    //     },
    //     error: (error) => {
    //       console.error('Error sending reminder:', error);
    //       this.errorMessage = 'An error occurred while sending reminder';
    //       this.sendingReminder = false;
    //     }
    //   });
  }

  /**
   * Modified setActiveTab to include feedback
   */
  setActiveTab(tab: 'conversation' | 'attachments' | 'history' | 'feedback'): void {
    this.activeTab = tab;

    // If switching to feedback tab, load feedback data
    if (tab === 'feedback' && this.complaint) {
      this.loadFeedback(this.complaint.complaint_id || '');
    }
  }

  /**
    * Close all dropdowns when clicking outside
    * Add this to your existing HostListener if you have one, 
    * or add this as a new method
    */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // Don't close dropdowns if click is on a dropdown toggle or menu
    if ((event.target as HTMLElement).closest('.dropdown-toggle') ||
      (event.target as HTMLElement).closest('.dropdown-menu')) {
      return;
    }

    // Close all dropdowns
    this.showStatusDropdown = false;
    this.showAssigneeDropdown = false;
  }
}

function getStatusDisplayName(arg0: string): string {
  throw new Error('Function not implemented.');
}
