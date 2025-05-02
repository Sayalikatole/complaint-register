import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Cl_getUserComplaintPayload, ComplaintService } from '../../../services/complaint.service';
import { Complaint } from '../../../models/complaint';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/auth';

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
  activeTab: 'conversation' | 'attachments' | 'history' = 'conversation';
  submittingReply: boolean = false;
  currentUser: UserData | null = null;

  role: string = '';

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

        if (user) {
          // Load departments after getting user data
          this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const id = params['id'];
            if (id) {
              this.loadComplaintDetails(id);
            }
          });
        }
      });


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load complaint details by ID
   */
  loadComplaintDetails(id: string): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.error = null;

    const userComplaint_data: Cl_getUserComplaintPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId,
      id: id
    };

    this.complaintService.getComplaintById(userComplaint_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaint = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading complaint details:', err);
          this.error = 'Failed to load complaint details. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Change the active tab
   */
  setActiveTab(tab: 'conversation' | 'attachments' | 'history'): void {
    this.activeTab = tab;
  }

  /**
   * Submit a reply/comment to the complaint
   */
  submitReply(): void {
    if (!this.replyText || !this.complaint?.complaint_id) return;

    this.submittingReply = true;

    this.complaintService.addComment(this.complaint.complaint_id, this.replyText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the complaint with the new comment
          if (this.complaint && response) {
            // Ideally, refresh the whole complaint or add the comment to the list
            this.loadComplaintDetails(this.complaint.complaint_id);
          }
          this.replyText = '';
          this.submittingReply = false;
        },
        error: (err) => {
          console.error('Error adding comment:', err);
          this.submittingReply = false;
          // Display error message
          this.error = 'Failed to add comment. Please try again.';
        }
      });
  }

  /**
   * Get the status badge color class
   */
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-gray-100 text-gray-800';
      case 'in progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
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
}