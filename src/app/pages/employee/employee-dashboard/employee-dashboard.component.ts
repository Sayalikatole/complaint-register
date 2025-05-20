import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats, ComplaintPriorityTrend, Cl_getUserDashboardPayload } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cl_getUserComplaintPayload, Cl_getUserCreatedComplaintPayload, ComplaintService } from '../../../services/complaint.service';
import { Complaint } from '../../../models/complaint';

// Register chart.js components and plugin
Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class EmployeeDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser: UserData | null = null;
  activeTab: 'created' | 'assigned' = 'assigned'; // Default to assigned view

  // Created complaints data
  createdComplaints: Complaint[] = [];
  filteredCreatedComplaints: Complaint[] = [];

  // Assigned complaints data
  assignedComplaints: Complaint[] = [];
  filteredAssignedComplaints: Complaint[] = [];

  // Dashboard statistics
  totalCreatedComplaints: number = 0;
  totalAssignedComplaints: number = 0;

  // Status summary for created complaints
  createdStatusSummary: Cl_getstatusSummary[] = [];
  createdOpenComplaints: number = 0;
  createdPendingComplaints: number = 0;
  createdResolvedComplaints: number = 0;
  createdClosedComplaints: number = 0;

  // Status summary for assigned complaints
  assignedStatusSummary: Cl_getstatusSummary[] = [];
  assignedOpenComplaints: number = 0;
  assignedInProgressComplaints: number = 0;
  assignedResolvedComplaints: number = 0;
  assignedClosedComplaints: number = 0;
  ticketStatusChartInstance: any;

  // Add these properties to your class
createdEscalatedComplaints: number = 0;
// createdClosedComplaints: number = 0;
avgResponseTime: any ; // This would come from your API

  // Priority trend data
  priority: ComplaintPriorityTrend[] = [];
  priorityTrend : ComplaintPriorityTrend[] = [];;

  //list of complaint
  showAllCreated = false;
showAllAssigned = false;


  // Error handling
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // for month chart
  labels: string[] = [];
monthlyData: (number | null)[] = [];


  private destroy$ = new Subject<void>();
  avgRating: any;
  createdAssignedOpenComplaints: number =0;
  createdAssignedPendingComplaints: number =0;
  createdAssignedResolvedComplaints: number =0;
  createdAssignedClosedComplaints: number=0;
  createdAssignedEscalatedComplaints: number=0;
  avgResponseAssignTime:any;
  totalAssignedCreatedComplaints: number=0;
  totalUserCreatedComplaints: number=0;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private complaintService: ComplaintService
  ) { }

  ngOnInit(): void {
    this.activeTab = 'assigned';  // or 'assigned' if that's default
    this.switchTab(this.activeTab);
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load both types of data
          this.loadgetAssignedUserPriorityStatus();
          this.loadgetUserCreatedComplaints();
          this.loadMonthlyCreatedUserComplint();
          this.loadCreatedUserComplaintSummery();
          this.loadAssignedUserComplaintSummery();
          this.loadUserAssignedComplaints();
          this.loadgetCreatedUserPriorityStatus();
        }
      });
  }

  ngAfterViewInit(): void {
  
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Switch between created and assigned complaint views
   */
  switchTab(tab: 'created' | 'assigned'): void {
    this.activeTab = tab;

    // Re-render charts based on active tab
    setTimeout(() => {
      if (tab === 'created') {
        this.loadMonthlyCreatedUserComplint();
        this.renderMonthlyUserCreateChart(this.labels, this.monthlyData);
        this.renderPriorityCreatedBarChart();   
      } else {
        // this.loadgetAssignedUserPriorityStatus();
       this.renderPriorityAssginedBarChart();
      }
      // this.renderPriorityAssginedBarChart();
    }, 100);
  }

  /**
   * Load All complaints created by the employee
   */
  loadgetUserCreatedComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const userComplaintData: Cl_getUserCreatedComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId
    };

    this.complaintService.getUserCreatedComplaints(userComplaintData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.createdComplaints = data;
          this.filteredCreatedComplaints = [...this.createdComplaints];
          this.totalCreatedComplaints = data.length;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading created complaints:', error);
          this.errorMessage = 'Failed to load your complaints. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load complaints assigned to the employee
   */
  loadUserAssignedComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const assignedComplaintData: Cl_getUserCreatedComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId
    };

    this.complaintService.getUserAssignedComplaints(assignedComplaintData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.assignedComplaints = data;
          this.filteredAssignedComplaints = [...this.assignedComplaints];
          this.totalAssignedComplaints = data.length;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading assigned complaints:', error);
          this.errorMessage = 'Failed to load assigned complaints. Please try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load Complt status for userrrr
   */
  
// Then in your loadCreatedComplaintStats method, make sure to set these values
loadCreatedUserComplaintSummery(): void {
  if (!this.currentUser) return;

  const payload: Cl_getDashboardPayload = {
    opr_id: this.currentUser.operatingUnitId,
    org_id: this.currentUser.organizationId,
    id: this.currentUser.userId,
  };

  this.dashboardService.getClientTotalCompltStats(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // ✅ You must assign this first
        this.createdStatusSummary = data.statusSummary || [];

        // ✅ Now safe to use .find()
        this.createdOpenComplaints = this.getCountFromStatus('OPEN');
        this.createdPendingComplaints = this.getCountFromStatus('IN_PROGRESS');
        this.createdResolvedComplaints = this.getCountFromStatus('RESOLVED');
        this.createdClosedComplaints = this.getCountFromStatus('CLOSED');
        this.createdEscalatedComplaints = this.getCountFromStatus('ESCALATED');
        this.avgResponseTime = data.avgResolutionTime ?? 'N/A';
        this.avgRating = data.avgRating ?? 'N/A';
        this.totalUserCreatedComplaints = data.totalComplaints ?? 0;

        console.log('CLOSED:', this.createdClosedComplaints);
        console.log('OPEN:', this.createdOpenComplaints);
        console.log('TOTALLL',this.totalCreatedComplaints)

        if (this.activeTab === 'created') {
        
        }
      },
      error: (error) => {
        console.error('Error loading created complaint stats:', error);
        this.errorMessage = 'Failed to load complaint statistics.';
      }
    });
}

loadAssignedUserComplaintSummery(): void {
  if (!this.currentUser) return;

  const payload: Cl_getUserDashboardPayload = {
    opr_id: this.currentUser.operatingUnitId,
    org_id: this.currentUser.organizationId,
    id: this.currentUser.userId,
  };

  this.dashboardService.getUsertAssignCompltStats(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // ✅ You must assign this first
        this.createdStatusSummary = data.statusSummary || [];

        // ✅ Now safe to use .find()
        this.createdAssignedOpenComplaints = this.getCountFromStatus('OPEN');
        this.createdAssignedPendingComplaints = this.getCountFromStatus('IN_PROGRESS');
        this.createdAssignedResolvedComplaints = this.getCountFromStatus('RESOLVED');
        this.createdAssignedClosedComplaints = this.getCountFromStatus('CLOSED');
        this.createdAssignedEscalatedComplaints = this.getCountFromStatus('ESCALATED');
        this.avgResponseAssignTime = data.avgResolutionTime ?? 'N/A';
        this.avgRating = data.avgRating ?? 'N/A';
        this.totalAssignedCreatedComplaints = data.totalComplaints ?? 0;


        if (this.activeTab === 'created') {
         
        }
      },
      error: (error) => {
        console.error('Error loading created complaint stats:', error);
        this.errorMessage = 'Failed to load complaint statistics.';
      }
    });
}

// Helper function for safety
getCountFromStatus(status: string): number {
  return this.createdStatusSummary.find(item => item.status === status)?.count || 0;
}

 

  /**
   * Load priority trend data for the employee's complaints
   */
  loadgetCreatedUserPriorityStatus(): void {
    if (!this.currentUser) return;

    const user_data: Cl_getUserDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId

    };

    this.dashboardService.getCreatedUserPriorityStatus(user_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.priority = data;
          this.renderPriorityCreatedBarChart()
          console.log(this.priority)

        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }

  loadgetAssignedUserPriorityStatus(): void {
    if (!this.currentUser) return;

    const user_data: Cl_getUserDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId

    };

    this.dashboardService.getAssignedUserPriorityStatus(user_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.priorityTrend = data;
          this.renderPriorityAssginedBarChart()
          console.log(this.priorityTrend)

        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }


  loadMonthlyCreatedUserComplint(): void {
    if (!this.currentUser) return;
  
    const payload: Cl_getDashboardPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId,
      id: this.currentUser.userId
    };
  
    this.dashboardService.getMonthlyUserComplaintCategoryStats(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ComplaintCategoryStats[]) => {
          const monthMap = new Map<string, number>();
  
          response.forEach(item => {
            monthMap.set(item.month, item.total_complaints);
          });
  
          const labels: string[] = [];
          const data: (number | null)[] = [];
  
          for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0'); // '01' to '12'
            labels.push(this.getMonthName(monthStr));
            data.push(monthMap.get(monthStr) ?? null);
          }
  
          this.labels = labels;
this.monthlyData = data;
this.renderMonthlyUserCreateChart(this.labels, this.monthlyData);

          // this.renderMonthlyTrendChart(labels, data);
        },
        error: (err) => {
          console.error('Error fetching monthly trend data:', err);
          this.errorMessage = 'Failed to load monthly complaint trend.';
        }
      });
  }

 
    getMonthName(monthNumber: string): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const index = parseInt(monthNumber, 10) - 1;
      return index >= 0 && index < 12 ? monthNames[index] : 'Invalid';
    }
  
  

    renderPriorityCreatedBarChart(): void {
      const canvas = document.getElementById('createdChart') as HTMLCanvasElement;
      if (!canvas) return;
    
      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();
    
      const labels = this.priority.map(p => p.priority);
      const data = this.priority.map(p => p.count);
    
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Priority Count',
            data,
            backgroundColor: [
              '#fecaca', // HIGH - light red
              '#fef9c3', // MEDIUM - light yellow
              '#d1fae5'  // LOW - light green
            ],
            borderColor: [
              '#f87171', // HIGH border
              '#facc15', // MEDIUM border
              '#34d399'  // LOW border
            ],
            borderWidth: 1,
            borderRadius: 10,
            barThickness: 25
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          animation: {
            duration: 1200,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#f3f4f6',
              titleColor: '#111827',
              bodyColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: '#6b7280',
                font: {
                  size: 13
                }
              },
              grid: {
                color: '#f3f4f6'
              }
            },
            y: {
              ticks: {
                color: '#6b7280',
                font: {
                  size: 13,
                  weight: 'bold'
                }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }


    renderPriorityAssginedBarChart(): void {
      const canvas = document.getElementById('assignedChart') as HTMLCanvasElement;
      if (!canvas) return;
    
      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();
    
      const labels = this.priorityTrend.map(p => p.priority);
      const data = this.priorityTrend.map(p => p.count);
    
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Priority Count',
            data,
            backgroundColor: [
              '#d1fae5', // LOW - light green
              '#fef9c3', // MEDIUM - light yellow
              '#fecaca', // HIGH - light red
            ],
            borderColor: [
              '#34d399',  // LOW border
              '#facc15', // MEDIUM border
              '#f87171', // HIGH border
            ],
            borderWidth: 1,
            borderRadius: 10,
            barThickness: 25
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          animation: {
            duration: 1200,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#f3f4f6',
              titleColor: '#111827',
              bodyColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: '#6b7280',
                font: {
                  size: 13
                }
              },
              grid: {
                color: '#f3f4f6'
              }
            },
            y: {
              ticks: {
                color: '#6b7280',
                font: {
                  size: 13,
                  weight: 'bold'
                }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
 
    


  /**
   * Render monthly trend chart for created user
   */
  renderMonthlyUserCreateChart(labels: string[], data: (number | null)[]): void {
    const canvas = document.getElementById('monthlyUserTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient (top to bottom)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // Tailwind blue-500 at top
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');   // Transparent at bottom

    // Destroy previous chart instances on same canvas
    if (Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: this.activeTab === 'created' ? 'My Created Complaints per Month' : 'Assigned Complaints per Month',
          data: data,
          fill: true, // Enable gradient background
          borderColor: '#3b82f6',
          backgroundColor: gradient,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#374151' // Tailwind gray-700
            },
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: { color: '#6b7280' } // Tailwind gray-500
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#6b7280'
            },
            title: {
              display: true,
              text: 'Number of Complaints',
              color: '#374151'
            }
          }
        }
      }
    });
  }

  toggleViewAll(event: Event): void {
    event.preventDefault();
    if (this.activeTab === 'created') {
      this.showAllCreated = !this.showAllCreated;
    } else {
      this.showAllAssigned = !this.showAllAssigned;
    }
  }
  
}