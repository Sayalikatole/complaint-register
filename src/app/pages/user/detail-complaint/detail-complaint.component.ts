import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Cl_createComplaintwithAttachmentPayload, Cl_getAttachmentPayload, Cl_getComplaintByIdPayload, Cl_getComplaintHistoryPayload, Cl_getUserComplaintPayload, ComplaintService, GetChatMessagesPayload, SendChatMessagePayload } from '../../../services/complaint.service';
import { Attachment, ChatMessage, Cl_createAttachmentPayload, Complaint, ComplaintHistoryItem, FeedbackData, FeedbackWithResponses } from '../../../models/complaint';
import { AuthService, Cl_getAssignableUsers } from '../../../services/auth.service';
import { UserByDepartment, UserData } from '../../../models/auth';
import { ComplaintStatus } from '../../../enums/complaint_status';

// Add the interface for message groups
interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-detail-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './detail-complaint.component.html',
  styleUrls: ['./detail-complaint.component.scss']
})
export class DetailComplaintComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer: ElementRef | null = null;
  @ViewChild('fileInput') fileInput: ElementRef | null = null;

  complaint: Complaint | null = null;
  loading: boolean = true;
  error: string | null = null;
  replyText: string = '';

  // Add these for managing file attachments
  selectedFile: File | null = null;
  selectedFileBase64: string | null = null;

  // Update the activeTab type to include 'feedback'
  activeTab: 'conversation' | 'attachments' | 'history' | 'feedback' = 'conversation';

  // For feedback response (admin/HOD feature)
  feedbackData: FeedbackWithResponses | null = null;
  loadingFeedback: boolean = false;
  feedbackError: string | null = null;
  hasFeedback: boolean = false;

  // For sending reminders
  canSendReminder: boolean = false;
  sendingReminder: boolean = false;

  submittingReply: boolean = false;
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
  complaintAttachments: Attachment[] = []; // Specifically for complaint attachments
  conversationAttachments: Attachment[] = []; // Specifically for conversation attachments
  loadingAttachments: boolean = false;
  attachmentError: string | null = null;

  // Add to your component properties
  historyItems: ComplaintHistoryItem[] = [];
  loadingHistory: boolean = false;
  historyError: string | null = null;

  // Add these properties for feedback
  feedback: FeedbackData | null = null;
  // loadingFeedback: boolean = false;
  // feedbackError: string | null = null;
  // hasFeedback: boolean = false;

  // For messages
  messages: ChatMessage[] = [];
  groupedMessages: MessageGroup[] = []; // Add this for grouped messages
  loadingMessages: boolean = false;
  messageError: string | null = null;

  // Add a flag to control scrolling behavior
  private scrollToBottom: boolean = false;

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
        this.role = this.currentUser?.l_role_name?.toLowerCase() || 'user';

        // Check if user can update assignees (admin, manager, or HOD)
        this.canUpdateAssignee = ['admin', 'hod'].includes(this.role);

        if (user) {
          // Load departments after getting user data
          this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const id = params['id'];
            if (id) {
              this.loadComplaintDetails(id);
              this.loadComplaintHistory(id);
              this.loadMessages(id);
              this.setupDueDateEditPermission();
              this.loadFeedback(id);
            }
          });
        }
      });

    // Determine if user can change status (HOD or employee)
    this.canChangeStatus = this.currentUser?.l_role_name?.toLowerCase() === 'hod' ||
      this.currentUser?.l_role_name?.toLowerCase() === 'employee';
  }

  // Add this method for AfterViewChecked lifecycle hook
  ngAfterViewChecked(): void {
    if (this.scrollToBottom && this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      this.scrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComplaintDetails(id: string): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.error = null;

    const userComplaint_data: Cl_getComplaintByIdPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: id,
      email: this.currentUser.email
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
          this.groupMessages();
          this.loadingMessages = false;
          this.scrollToBottom = true;
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
   * Group messages by date for display
   */
  groupMessages(): void {
    const groups: { [key: string]: ChatMessage[] } = {};

    this.messages.forEach(message => {
      if (!message.sent_on) return;

      // Get date part only (YYYY-MM-DD)
      const date = new Date(message.sent_on).toISOString().split('T')[0];

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(message);
    });

    // Convert to array format needed for template
    this.groupedMessages = Object.keys(groups).map(date => ({
      date,
      messages: groups[date]
    }));
  }

  /**
   * Load attachments for this complaint and separate them by type
   */
  loadAttachments(complaintId: string): void {
    this.loadingAttachments = true;
    this.attachmentError = null;

    const attachmentPayload: Cl_getAttachmentPayload = {
      id: complaintId,
      entity_type: 'Complaint'
    };

    this.complaintService.getAttachment(attachmentPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response)) {
            // Store all attachments
            this.attachments = response;

            // Separate complaint attachments (these are the ones uploaded with the complaint)
            this.complaintAttachments = response.filter(attachment =>
              attachment.entity_type === 'Complaint');

            // Now load conversation attachments separately
            this.loadConversationAttachments(complaintId);
          } else {
            this.attachmentError = 'Failed to load attachments - Invalid response format';
            this.attachments = [];
            this.complaintAttachments = [];
            this.loadingAttachments = false;
          }
        },
        error: (error) => {
          console.error('Error loading attachments:', error);
          this.attachmentError = 'Error loading attachments. Please try again.';
          this.attachments = [];
          this.complaintAttachments = [];
          this.loadingAttachments = false;
        }
      });
  }

  /**
   * Load conversation attachments
   */
  loadConversationAttachments(complaintId: string): void {
    const conversationAttachmentPayload = {
      id: complaintId,
      entity_type: 'Message'
    };

    // this.complaintService.getMessageAttachments(conversationAttachmentPayload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       if (response && Array.isArray(response)) {
    //         this.conversationAttachments = response;
    //       } else {
    //         this.conversationAttachments = [];
    //       }
    //       this.loadingAttachments = false;
    //     },
    //     error: (error) => {
    //       console.error('Error loading conversation attachments:', error);
    //       this.conversationAttachments = [];
    //       this.loadingAttachments = false;
    //     }
    //   });
  }

  /**
   * File selection method
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      // Convert file to base64 for sending to API
      this.convertFileToBase64(this.selectedFile);
    }
  }

  /**
   * Convert file to base64 format
   */
  convertFileToBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data:application/pdf;base64, prefix if present
      this.selectedFileBase64 = base64String.includes('base64,')
        ? base64String.split('base64,')[1]
        : base64String;
    };
    reader.onerror = (error) => {
      console.error('Error converting file to base64:', error);
      this.errorMessage = 'Error processing file attachment';
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove selected file
   */
  removeSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Submit a reply/comment to the complaint with attachment
   */
  submitReply(): void {
    if ((!this.replyText && !this.selectedFile) || !this.complaint?.complaint_id || !this.currentUser?.userId) return;

    this.submittingReply = true;

    // Determine who to send the message to
    // In most cases, this would be the complaint creator or the assignee
    let receiverId = this.complaint.created_by;

    // If the current user is the creator, send to the assignee instead
    if (this.currentUser.userId === this.complaint.created_by && this.complaint.assigned_to) {
      receiverId = this.complaint.assigned_to;
    }

    // Prepare attachment data if a file is selected
    let attachmentData: Attachment | null = null;
    if (this.selectedFile && this.selectedFileBase64) {
      attachmentData = {
        attachment_id: '',
        entity_type: 'Complaint',
        entity_id: this.complaint.complaint_id,
        uploaded_by: this.currentUser.userId,
        uploaded_on: new Date().toISOString(),
        uploaded_file_name: this.selectedFile.name,
        file_path: "C:\\Micropro_ComplaintReport", // Default path as per payload example
        stored_file_name: `${Date.now()}_${this.selectedFile.name}`,
        l_encrypted_file: this.selectedFileBase64
      };
    }

    const payload: SendChatMessagePayload = {
      complaintId: this.complaint.complaint_id,
      senderId: this.currentUser.userId,
      // senderName: this.currentUser.username || this.currentUser.userId,
      receiverId: receiverId,
      message: this.replyText || '', // Allow empty message if there's an attachment
      attachmentTrn: attachmentData
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
            message: this.replyText || '',
            sent_on: new Date().toISOString(),
            attachment: attachmentData ? attachmentData : null,
          };

          this.messages.push(newMessage);
          this.groupMessages(); // Re-group messages with the new one
          this.replyText = '';
          this.removeSelectedFile();
          this.submittingReply = false;
          this.scrollToBottom = true;

          // If message has attachment, refresh conversation attachments list
          if (attachmentData) {
            this.loadConversationAttachments(this.complaint?.complaint_id || '');
          }
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.submittingReply = false;
          this.errorMessage = 'Failed to send message. Please try again.';

          // Clear error after 3 seconds
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      });
  }

  /**
   * Cancel reply and clear the text
   */
  cancelReply(): void {
    this.replyText = '';
    this.removeSelectedFile();
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
   * Get CSS classes for file icon
   */
  getFileIconClass(filename: string): string {
    if (!filename) return 'fas fa-file';

    const extension = filename.split('.').pop()?.toLowerCase();
    let iconClass = 'fas fa-file';

    switch (extension) {
      case 'pdf': iconClass = 'fas fa-file-pdf text-red-500'; break;
      case 'doc': case 'docx': iconClass = 'fas fa-file-word text-blue-500'; break;
      case 'xls': case 'xlsx': iconClass = 'fas fa-file-excel text-green-500'; break;
      case 'ppt': case 'pptx': iconClass = 'fas fa-file-powerpoint text-orange-500'; break;
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp':
        iconClass = 'fas fa-file-image text-purple-500'; break;
      case 'zip': case 'rar': case '7z': iconClass = 'fas fa-file-archive text-yellow-600'; break;
      case 'txt': iconClass = 'fas fa-file-alt text-gray-500'; break;
      default: iconClass = 'fas fa-file text-gray-500';
    }

    return iconClass;
  }

  /**
   * Get file size display
   */
  formatFileSize(size: number): string {
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
    if (!this.currentUser) {
      this.canUpdateDueDate = false;
      return;
    }

    // Get current user role and ID
    const userRole = this.currentUser.l_role_name?.toUpperCase();
    const userId = this.currentUser.userId;

    // Check if complaint exists
    if (!this.complaint) {
      this.canUpdateDueDate = false;
      return;
    }

    // HOD permission check
    const isHOD = userRole === 'HOD';
    const isForHODDepartment = this.complaint.department_id === this.currentUser.department_id;

    // Assigned employee check
    const isAssignedEmployee = this.complaint.assigned_to === userId;

    // Set permission based on conditions
    this.canUpdateDueDate = (isHOD) || isAssignedEmployee;
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
      modified_by: this.currentUser?.userId,
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
            this.errorMessage = '';
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
   * Download message attachment
   */
  downloadMessageAttachment(attachment: Attachment): void {
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
   * View message attachment
   */
  viewMessageAttachment(attachment: Attachment): void {
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
        this.downloadMessageAttachment(attachment);
      }
    } catch (error) {
      console.error('Error viewing message attachment:', error);
      this.loadingAttachments = false;
      this.attachmentError = 'Unable to view this file. Downloading instead...';

      // Attempt to download instead
      setTimeout(() => {
        this.attachmentError = null;
        this.downloadMessageAttachment(attachment);
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
    const userName = user ? user.name : null;

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
    console.log('Selected assignee:', userName);

    // Create update payload
    const updatedComplaint = {
      ...this.complaint,
      l_previous_status: this.complaint.status,
      l_assigned_to: userName,
      status: ComplaintStatus.ASSIGNED,
      modified_by: this.currentUser?.userId,
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
   * Get status color class for timeline
   */
  getStatusColorClass(status: string): string {
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
   * Get the status badge color class
   */
  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case ComplaintStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case ComplaintStatus.ASSIGNED:
        return 'bg-yellow-100 text-yellow-800';
      case ComplaintStatus.IN_PROGRESS:
        return 'bg-indigo-100 text-indigo-800';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-100 text-green-800';
      case ComplaintStatus.CLOSED:
        return 'bg-red-100 text-red-800';
      case ComplaintStatus.ESCALATED:
        return 'bg-purple-100 text-purple-800';
      case ComplaintStatus.DEFERRED:
        return 'bg-orange-100 text-orange-800';
      case ComplaintStatus.REOPEN:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
   * Format message date for display in groups
   */
  formatMessageDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // For older dates, use short format
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Format message time for display
   */
  formatMessageTime(timestamp?: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string | undefined): string {
    if (!name) return 'AN';

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
          this.feedbackData = feedbackData;
          this.hasFeedback = !!feedbackData;
          this.loadingFeedback = false;

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
   * Submit feedback response
   */
  submitFeedbackResponse(): void {
    // if (!this.feedback?.feedback_id || !this.feedbackResponse || !this.currentUser) return;

    // this.submittingResponse = true;

    // const payload = {
    //   feedback_id: this.feedback.feedback_id,
    //   complaint_id: this.complaint?.complaint_id || '',
    //   response: this.feedbackResponse,
    //   responder_id: this.currentUser.userId,
    //   responder_name: this.currentUser.username || this.currentUser.userId,
    //   org_id: this.currentUser.organizationId,
    //   opr_id: this.currentUser.operatingUnitId
    // };

    // this.complaintService.respondToFeedback(payload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.successMessage = 'Response submitted successfully';
    //       this.feedbackResponse = '';
    //       this.submittingResponse = false;

    //       // Reload feedback to show the response
    //       this.loadFeedback(this.complaint?.complaint_id || '');

    //       setTimeout(() => {
    //         this.successMessage = '';
    //       }, 3000);
    //     },
    //     error: (error) => {
    //       console.error('Error submitting response:', error);
    //       this.errorMessage = 'Failed to submit response. Please try again.';
    //       this.submittingResponse = false;

    //       setTimeout(() => {
    //         this.errorMessage = '';
    //       }, 3000);
    //     }
    //   });
  }

  // Helper method to get rating display text
  getRatingText(rating: number): string {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Not Rated';
    }
  }

  /**
   * Send feedback reminder
   */
  sendFeedbackReminder(): void {
    // if (!this.complaint?.complaint_id || !this.currentUser) return;

    // this.sendingReminder = true;

    // const payload = {
    //   complaint_id: this.complaint.complaint_id,
    //   sender_id: this.currentUser.userId,
    //   sender_name: this.currentUser.username || this.currentUser.userId
    // };

    // this.complaintService.sendFeedbackReminder(payload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.successMessage = 'Feedback reminder sent successfully';
    //       this.sendingReminder = false;

    //       setTimeout(() => {
    //         this.successMessage = '';
    //       }, 3000);
    //     },
    //     error: (error) => {
    //       console.error('Error sending reminder:', error);
    //       this.errorMessage = 'Failed to send reminder. Please try again.';
    //       this.sendingReminder = false;

    //       setTimeout(() => {
    //         this.errorMessage = '';
    //       }, 3000);
    //     }
    //   });
  }

  /**
   * Update complaint status
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
            // Refresh the complaint data to get updated fields
            this.loadComplaintDetails(this.complaint?.complaint_id || '');
            this.successMessage = `Status updated to ${newStatus}`;

            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = response?.statusMsg || 'Failed to update status';

            setTimeout(() => {
              this.errorMessage = '';
            }, 3000);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.errorMessage = 'An error occurred while updating status';
          this.loading = false;

          setTimeout(() => {
            this.errorMessage = '';
          }, 3000);
        }
      });
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
   * Display status in a user-friendly way
   */
  getStatusDisplay(status: string): string {
    // Assuming this function exists elsewhere
    return this.formatStatusName(status || 'Not set');
  }

  /**
   * Format status name for display
   */
  formatStatusName(status: string): string {
    // Replace underscores with spaces and capitalize each word
    return status.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
   * Navigate back to complaints list
   */
  goBack(): void {
    this.router.navigate(['/', this.role, 'complaints']);
  }

  /**
   * Get filtered assignees based on search term
   */
  get filteredAssignees(): UserByDepartment[] {
    if (!this.assigneeSearchTerm || this.assigneeSearchTerm.trim() === '') {
      return this.assignees;
    }

    const term = this.assigneeSearchTerm.toLowerCase().trim();
    return this.assignees.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      (user.department_id && user.department_id.toLowerCase().includes(term)) ||
      (user.role_id && user.role_id.toLowerCase().includes(term))
    );
  }

  /**
   * Close all dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Close due date picker if open and clicked outside
    if (this.showDueDatePicker) {
      const datePickerElement = document.getElementById('dueDatePicker');
      if (datePickerElement && !datePickerElement.contains(target) &&
        !target.closest('button[data-target="dueDatePicker"]')) {
        this.showDueDatePicker = false;
      }
    }

    // Close assignee dropdown if open and clicked outside
    if (this.showAssigneeDropdown) {
      const assigneeElement = document.getElementById('assigneeDropdown');
      if (assigneeElement && !assigneeElement.contains(target) &&
        !target.closest('button[data-target="assigneeDropdown"]')) {
        this.showAssigneeDropdown = false;
      }
    }

    // Close status dropdown if open and clicked outside
    if (this.showStatusDropdown) {
      const statusElement = document.getElementById('statusDropdown');
      if (statusElement && !statusElement.contains(target) &&
        !target.closest('button[data-target="statusDropdown"]')) {
        this.showStatusDropdown = false;
      }
    }
  }
}