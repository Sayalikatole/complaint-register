import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats, ComplaintPriorityTrend } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cl_getUserComplaintPayload, ComplaintService } from '../../../services/complaint.service';
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

  // Add these properties to your class
createdEscalatedComplaints: number = 0;
// createdClosedComplaints: number = 0;
avgResponseTime: any = '3.2'; // This would come from your API

  // Priority trend data
  priorityTrend: ComplaintPriorityTrend[] = [];

  // Error handling
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private complaintService: ComplaintService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load both types of data
          this.loadCreatedComplaints();
          this.loadAssignedComplaints();
          this.loadCreatedComplaintStats();
          this.loadAssignedComplaintStats();
          this.loadPriorityTrend();
        }
      });
  }

  ngAfterViewInit(): void {
    // We'll render charts when data is available
    this.loadMonthlyComplaintTrend();
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
        this.renderCreatedStatusChart();
      } else {
        this.renderAssignedStatusChart();
      }
      this.renderPriorityPieChart();
    }, 100);
  }

  /**
   * Load complaints created by the employee
   */
  loadCreatedComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    const userComplaintData: Cl_getUserComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId
    };

    this.complaintService.getUserComplaints(userComplaintData)
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
  loadAssignedComplaints(): void {
    this.isLoading = true;
    if (!this.currentUser) return;

    // const assignedComplaintData: Cl_getAssignedComplaintPayload = {
    //   opr_id: this.currentUser.operatingUnitId,
    //   org_id: this.currentUser.organizationId,
    //   assignedTo: this.currentUser.userId
    // };

    // this.complaintService.getAssignedComplaints(assignedComplaintData)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (data) => {
    //       this.assignedComplaints = data;
    //       this.filteredAssignedComplaints = [...this.assignedComplaints];
    //       this.totalAssignedComplaints = data.length;
    //       this.isLoading = false;
    //     },
    //     error: (error) => {
    //       console.error('Error loading assigned complaints:', error);
    //       this.errorMessage = 'Failed to load assigned complaints. Please try again.';
    //       this.isLoading = false;
    //     }
    //   });
  }

  /**
   * Load statistics for complaints created by the employee
   */
  
// Then in your loadCreatedComplaintStats method, make sure to set these values
loadCreatedComplaintStats(): void {
  if (!this.currentUser) return;

  const payload: Cl_getDashboardPayload = {
    opr_id: this.currentUser.operatingUnitId,
    org_id: this.currentUser.organizationId,
    id: this.currentUser.userId,
    // type: 'created'
  };

  this.dashboardService.getClientTotalCompltStats(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // this.createdStatusSummary = data.statusSummary || [];
        this.createdOpenComplaints = this.createdStatusSummary.find(item => item.status === 'OPEN')?.count || 0;
        this.createdPendingComplaints = this.createdStatusSummary.find(item => item.status === 'IN_PROGRESS')?.count || 0;
        this.createdResolvedComplaints = this.createdStatusSummary.find(item => item.status === 'RESOLVED')?.count || 0;
        this.createdClosedComplaints = this.createdStatusSummary.find(item => item.status === 'CLOSED')?.count || 0;
        this.createdEscalatedComplaints = this.createdStatusSummary.find(item => item.status === 'ESCALATED')?.count || 0;
        this.avgResponseTime = data.avgResolutionTimeInHours || '3.2';
        
        // Render chart only if this is the active tab
        if (this.activeTab === 'created') {
          this.renderCreatedStatusChart();
        }
      },
      error: (error) => {
        console.error('Error loading created complaint stats:', error);
        this.errorMessage = 'Failed to load complaint statistics.';
      }
    });
}

  /**
   * Load statistics for complaints assigned to the employee
   */
  loadAssignedComplaintStats(): void {
    if (!this.currentUser) return;

    const payload: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.userId,
      // type: 'assigned'
    };

    // this.dashboardService.getUserComplaintStats(payload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (data) => {
    //       this.assignedStatusSummary = data.statusSummary || [];
    //       this.assignedOpenComplaints = this.assignedStatusSummary.find(item => item.status === 'OPEN')?.count || 0;
    //       this.assignedInProgressComplaints = this.assignedStatusSummary.find(item => item.status === 'IN_PROGRESS')?.count || 0;
    //       this.assignedResolvedComplaints = this.assignedStatusSummary.find(item => item.status === 'RESOLVED')?.count || 0;
    //       this.assignedClosedComplaints = this.assignedStatusSummary.find(item => item.status === 'CLOSED')?.count || 0;

    //       // Render chart only if this is the active tab
    //       if (this.activeTab === 'assigned') {
    //         this.renderAssignedStatusChart();
    //       }
    //     },
    //     error: (error) => {
    //       console.error('Error loading assigned complaint stats:', error);
    //       this.errorMessage = 'Failed to load assigned complaint statistics.';
    //     }
    //   });
  }

  /**
   * Load priority trend data for the employee's complaints
   */
  loadPriorityTrend(): void {
    if (!this.currentUser) return;

    // const payload: Cl_getDashboardPayload = {
    //   opr_id: this.currentUser.operatingUnitId,
    //   org_id: this.currentUser.organizationId,
    //   id: this.currentUser.userId,
    //   type: this.activeTab
    // };

    // this.dashboardService.getComplaintPriorityTrend(payload)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (data) => {
    //       this.priorityTrend = data;
    //       this.renderPriorityPieChart();
    //     },
    //     error: (error) => {
    //       console.error('Error loading priority trend:', error);
    //     }
    //   });
  }

  /**
   * Load monthly complaint trend
   */
  loadMonthlyComplaintTrend(): void {
    if (!this.currentUser) return;

    const payload: Cl_getDashboardPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId,
      id: this.currentUser.userId,
      // type: this.activeTab
    };

    this.dashboardService.getMonthlyComplaintCategoryStats(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ComplaintCategoryStats[]) => {
          // Map month to total_complaints
          const monthMap = new Map<string, number>();
          response.forEach(item => {
            monthMap.set(item.month, item.total_complaints);
          });

          const labels: string[] = [];
          const data: (number | null)[] = [];

          // Fill data for all 12 months
          for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0'); // '01' to '12'
            labels.push(this.getMonthName(monthStr));
            data.push(monthMap.get(monthStr) ?? null); // Use null if data is missing
          }

          this.renderMonthlyTrendChart(labels, data);
        },
        error: (err) => {
          console.error('Error fetching monthly trend data:', err);
          this.errorMessage = 'Failed to load monthly complaint trend.';
        }
      });
  }

  /**
   * Render chart for created complaints status
   */
  renderCreatedStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart if exists
    if (Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    const labels = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const data = [
      this.createdOpenComplaints,
      this.createdPendingComplaints,
      this.createdResolvedComplaints,
      this.createdClosedComplaints
    ];

    const backgroundColors = [
      'rgba(255, 99, 132, 0.2)',  // Open
      'rgba(255, 206, 86, 0.2)',  // In Progress
      'rgba(75, 192, 192, 0.2)',  // Resolved
      'rgba(54, 162, 235, 0.2)'   // Closed
    ];

    const borderColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(54, 162, 235, 0.8)'
    ];

    const chartOptions: ChartConfiguration['options'] = {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutElastic'
      },
      plugins: {
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#fff',
          bodyColor: '#f9fafb'
        },
        legend: {
          position: 'top',
          labels: {
            color: '#374151'
          }
        },
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#000',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value: number) => (value > 0 ? value : ''),
          clip: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    };

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'My Created Complaints by Status',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }
        ]
      },
      options: chartOptions,
      plugins: [ChartDataLabels]
    });
  }

  /**
   * Render chart for assigned complaints status
   */
  renderAssignedStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart if exists
    if (Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    const labels = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const data = [
      this.assignedOpenComplaints,
      this.assignedInProgressComplaints,
      this.assignedResolvedComplaints,
      this.assignedClosedComplaints
    ];

    const backgroundColors = [
      'rgba(255, 99, 132, 0.2)',  // Open
      'rgba(255, 206, 86, 0.2)',  // In Progress
      'rgba(75, 192, 192, 0.2)',  // Resolved
      'rgba(54, 162, 235, 0.2)'   // Closed
    ];

    const borderColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(54, 162, 235, 0.8)'
    ];

    const chartOptions: ChartConfiguration['options'] = {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutElastic'
      },
      plugins: {
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#fff',
          bodyColor: '#f9fafb'
        },
        legend: {
          position: 'top',
          labels: {
            color: '#374151'
          }
        },
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#000',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value: number) => (value > 0 ? value : ''),
          clip: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    };

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Assigned Complaints by Status',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }
        ]
      },
      options: chartOptions,
      plugins: [ChartDataLabels]
    });
  }

  /**
   * Render priority pie chart
   */
  renderPriorityPieChart(): void {
    const canvas = document.getElementById('priorityChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    // Ensure priority data is present
    if (!this.priorityTrend || this.priorityTrend.length === 0) return;

    const labels = this.priorityTrend.map(item => item.priority);
    const data = this.priorityTrend.map(item => item.count);

    const backgroundColors = [
      'rgba(255, 99, 132, 0.6)',    // HIGH
      'rgba(255, 206, 86, 0.6)',    // MEDIUM
      'rgba(75, 192, 192, 0.6)'     // LOW
    ];

    const borderColors = [
      'rgba(255, 99, 132, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)'
    ];

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#f9fafb'
          },
          legend: {
            position: 'top',
            labels: {
              color: '#374151'
            }
          },
          datalabels: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value: number) => (value > 0 ? value : '')
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  /**
   * Render monthly trend chart
   */
  renderMonthlyTrendChart(labels: string[], data: (number | null)[]): void {
    const canvas = document.getElementById('monthlyTrendChart') as HTMLCanvasElement;
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

  /**
   * Convert month number to name
   */
  getMonthName(monthNumber: string): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const index = parseInt(monthNumber, 10) - 1;
    return index >= 0 && index < 12 ? monthNames[index] : 'Invalid';
  }
}