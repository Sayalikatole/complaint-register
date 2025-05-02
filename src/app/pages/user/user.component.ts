import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../models/auth';
import { AuthService } from '../../services/auth.service';
import { ComplaintService, Cl_getUserComplaintPayload } from '../../services/complaint.service';
import { Complaint } from '../../models/complaint';
import Chart from 'chart.js/auto';
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  // Complaints data
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];

  // Filter and sort options
  searchTerm: string = '';
  selectedStatus: string = 'all';
  sortBy: string = 'newest';

  // Dropdown control variables
  isStatusFilterOpen: boolean = false;
  isSortOpen: boolean = false;

  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string = '';
  currentUser: UserData | null = null;

  // Unsubscribe observable
  private destroy$ = new Subject<void>();
  constructor(private complaintService: ComplaintService, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments after getting user data
          this.loadComplaints();
        }
      });

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  ngAfterViewInit() {
    const ctx = document.getElementById('ticketStatusChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Resolved', 'In Progress', 'Open'],
        datasets: [{
          label: 'Tickets',
          data: [27, 14, 7],
          backgroundColor: ['#10B981', '#FBBF24', '#EF4444'],
          borderColor: ['#059669', '#D97706', '#DC2626'],
          borderWidth: 1,
          borderRadius: 5, // adds rounded corners
          hoverBackgroundColor: ['#059669', '#D97706', '#DC2626'],
          hoverBorderColor: '#000',
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        animation: {
          duration: 1500,
          easing: 'easeOutElastic'
        },
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#fff',
            bodyColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#9ca3af',
            cornerRadius: 6
          }
        }
      }
    });
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

    // Close status filter dropdown if clicked outside
    if (this.isStatusFilterOpen && !target.closest('.relative')) {
      this.isStatusFilterOpen = false;
    }

    // Close sort dropdown if clicked outside
    if (this.isSortOpen && !target.closest('.relative')) {
      this.isSortOpen = false;
    }
  }

  /**
    * Load complaints from the service
    */
  loadComplaints(): void {
    // this.isLoading = true;
    if (!this.currentUser) return;

    console.log(this.currentUser)
    const userComplaint_data: Cl_getUserComplaintPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId,
      id: this.currentUser.userId
    };
    this.complaintService.getUserComplaints(userComplaint_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaints = data;
          console.log(this.complaints)

          console.log(data)

          this.filteredComplaints = [...this.complaints];
          console.log(this.filteredComplaints)
          // this.applyFilters();
          // this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.errorMessage = 'Failed to load complaints. Please try again.';
          // this.isLoading = false;
        }
      });
  }
}
