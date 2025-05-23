import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ✅ UNCOMMENTED

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats, ComplaintPriorityTrend, ComplaintDueDatetrend } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cl_getUserComplaintPayload, ComplaintService } from '../../../services/complaint.service';
import { Complaint } from '../../../models/complaint';
import { RouterModule } from '@angular/router';

// ✅ Register chart.js components and plugin
Chart.register(...registerables);
Chart.register(ChartDataLabels);


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule,RouterModule],
  standalone: true
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser: UserData | null = null;
  dashboardData: Dashboardata[] = [];
  dashDepStatus: DepartmentWiseComplaint[] = [];
  departmentList: DeptmentList[] = [];
  selectedDepartmentId: string = ''; // For ngModel binding
  filteredDepStatus: DepartmentWiseComplaint[] = []; // To hold filtered data


  errorMessage: string = '';
  successMessage: string = '';
  private destroy$ = new Subject<void>();
  totalComplaints: any;
  avgRating:any
  openComplaints: any;
  pendingComplaints: any;
  resolvedComplaints: any;
  avgResolutionTime: any;
  closedComplaints: any;
  statusSummary: Cl_getstatusSummary[] = []
  assignedComplaints: any;
  reopenComplaints: any;
  defferedComplaints: any;
  escalatedComplaints: any;
  showOtherComplaintsModal = false;
  priority: ComplaintPriorityTrend[] = [];
   // Complaints data
   complaints: Complaint[] = [];
   dueDateComplaints: ComplaintDueDatetrend[] = [];
  //  filteredComplaints: Complaint[] = [];
  // allComplaints: Complaint[] = [];
  // allComplaintsVisible = false;
  searchTerm: string = '';
allComplaints: any[] = [];
filteredComplaints: any[] = [];
visibleComplaints: any[] = [];
allComplaintsVisible: boolean = false;

  
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
          this.loadDepartmentTotalCompltStats();
          this.loadgetDashboardComplaintStats();
          this.loadAllDepatList();
          this.loadgetAdminPriorityComplaintStatus();
          this.loadComplaints();
        }
      });
  }

  ngAfterViewInit(): void {
    // We don't call chart here because the data isn't loaded yet.
    this.loadMonthlyComplaintTrend(); // ✅ passing both arguments
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  renderMonthlyTrendChart(labels: string[], data: (number | null)[]): void {
    const canvas = document.getElementById('monthlyTrendChart') as HTMLCanvasElement;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    // Create a smooth blue gradient for the background fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // Top: blue with opacity
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');   // Bottom: transparent
  
    // Destroy all previous chart instances on the same canvas
    if ((Chart as any).instances?.length) {
      (Chart as any).instances.forEach((instance: any) => instance.destroy());
    }
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Complaints per Month',
          data: data,
          fill: true, // Enable fill below the line
          borderColor: '#3B82F6', // Tailwind blue-500
          backgroundColor: gradient,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#374151' // Tailwind gray-700
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#6B7280' // Tailwind gray-500
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#6B7280'
            },
            title: {
              display: true,
              text: 'Number of Complaints',
              color: '#374151',
              font: {
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  }
  

  getMonthName(monthNumber: string): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const index = parseInt(monthNumber, 10) - 1;
    return index >= 0 && index < 12 ? monthNames[index] : 'Invalid';
  }


// ================================NEW CODE WITH SERACH FILTER ======================


loadComplaints(): void {
  if (!this.currentUser) return;

  const userComplaint_data: Cl_getUserComplaintPayload = {
    opr_id: this.currentUser.operatingUnitId,
    org_id: this.currentUser.organizationId,
    id: this.currentUser.userId
  };

  this.complaintService.getUserComplaints(userComplaint_data)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.allComplaints = data;
        // Initially set filteredComplaints to all complaints
        this.filteredComplaints = [...this.allComplaints];
        // Update the visible complaints: if no search, show top 5
        this.updateVisibleComplaints();
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
        this.errorMessage = 'Failed to load complaints. Please try again.';
      }
    });
}

// Called on (input) of the search field
applySearchFilter(): void {
  const term = this.searchTerm.toLowerCase().trim();

  if (!term) {
    // If no search term, reset filter to include all complaints
    this.filteredComplaints = [...this.allComplaints];
  } else {
    // Filter complaints by subject, department, or status
    this.filteredComplaints = this.allComplaints.filter(c =>
      (c.subject && c.subject.toLowerCase().includes(term)) ||
      (c.l_department_name && c.l_department_name.toLowerCase().includes(term)) ||
      (c.status && c.status.toLowerCase().includes(term)) || (c.priority && c.priority.toLowerCase().includes(term))
    );
  }

  // Reset toggle state when search is active
  if (term) {
    this.allComplaintsVisible = true;
  } else {
    // If search is cleared, revert to the default view (top 5)
    this.allComplaintsVisible = false;
  }
  
  this.updateVisibleComplaints();
}

// This method determines what goes into visibleComplaints based on search and the toggle state
updateVisibleComplaints(): void {
  // If there's a search term, show all filtered results
  if (this.searchTerm.trim().length > 0) {
    this.visibleComplaints = [...this.filteredComplaints];
  } else {
    // No search term: check the toggle state
    if (this.allComplaintsVisible) {
      // Show all filtered complaints
      this.visibleComplaints = [...this.filteredComplaints];
    } else {
      // Show only the top 5 complaints
      this.visibleComplaints = this.filteredComplaints.slice(0, 5);
    }
  }
}

toggleComplaintView(): void {
  // Toggle the state
  this.allComplaintsVisible = !this.allComplaintsVisible;
  // Update visible complaints accordingly
  this.updateVisibleComplaints();
}





  closeModal() {
    this.showOtherComplaintsModal = false;
  }

 
  loadDepartmentTotalCompltStats(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId
    };

    this.dashboardService.getAdminTotalCompltStats(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {

          this.totalComplaints = data.totalComplaints
          this.avgResolutionTime = data.avgResolutionTime
          this.avgRating = data.avgRating
          this.statusSummary = data.statusSummary
          this.openComplaints = this.statusSummary.find(item => item.status === 'OPEN')?.count || 0;
          this.pendingComplaints = this.statusSummary.find(item => item.status === 'IN_PROGRESS')?.count || 0;
          this.resolvedComplaints = this.statusSummary.find(item => item.status === 'RESOLVED')?.count || 0;
          this.assignedComplaints = this.statusSummary.find(item => item.status === 'ASSIGNED')?.count || 0;
          this.closedComplaints = this.statusSummary.find(item => item.status === 'CLOSED')?.count || 0;
          this.reopenComplaints = this.statusSummary.find(item => item.status === 'REOPEN')?.count || 0;
          this.defferedComplaints = this.statusSummary.find(item => item.status === 'DEFERRED')?.count || 0;
          this.escalatedComplaints = this.statusSummary.find(item => item.status === 'ESCALATED')?.count || 0;


          console.log(this.statusSummary)
        },
        error: (error) => {
          console.error('Error loading total stats:', error);
          this.errorMessage = 'Failed to load stats.';
        }
      });
  }


  loadDueDateComplaints(): void {
    if (!this.currentUser) return;
  
    const payload: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      // id: "0333157788020510"  // Set dynamically if needed
    };
  
    this.dashboardService.getDueDateComplaintStatus(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dueDateComplaints = data;
          this.showOtherComplaintsModal = true;
          console.log('Due date complaints:', this.dueDateComplaints);
          // Optionally call a method to render this in a table or chart
        },
        error: (error) => {
          console.error('Error loading due date complaints:', error);
          this.errorMessage = 'Failed to load due date complaints.';
        }
      });
  }
  

  loadAllDepatList(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId
    };

    this.dashboardService.getAllDepatList(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departmentList = data;
          console.log(this.departmentList)
          this.renderDepartmentChart(); // call chart only when data is ready
        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }

  loadgetDashboardComplaintStats(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId
    };

    this.dashboardService.getDashboardComplaintStats(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashDepStatus = data;
          this.filteredDepStatus = data; // Default to full list
          this.renderDepartmentChart(); // call chart only when data is ready
        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }

  loadMonthlyComplaintTrend(): void {
    if (!this.currentUser) return;

    const payload: Cl_getDashboardPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId
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

  onDepartmentFilterChange(): void {
    if (this.selectedDepartmentId) {
      const selectedDept = this.departmentList.find(dep => dep.department_id === this.selectedDepartmentId);
      if (selectedDept) {
        this.filteredDepStatus = this.dashDepStatus.filter(
          dep => dep.department_name === selectedDept.department_name
        );
      }
    } else {
      // All departments
      this.filteredDepStatus = this.dashDepStatus;
    }

    this.renderDepartmentChart();
  }
  loadgetAdminPriorityComplaintStatus(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
    };

    this.dashboardService.getHodPriorityComplaintStatus(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.priority = data;
          this.renderPriorityPieChart()
          console.log(this.priority)
         
        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }

  
  
  renderDepartmentChart(): void {
    const labels = this.filteredDepStatus.map(item => item.department_name);
    const canvas = document.getElementById('departmentsChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    // ✅ Define shared chart options inside the function
    const chartOptions: ChartConfiguration['options'] = {
      responsive: true,
      animation: {
        duration: 1200,
        easing: 'easeOutBounce'
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

    if (!this.selectedDepartmentId) {
      // ✅ Show only total complaints for all departments
      const totalData = this.filteredDepStatus.map(item => item.total || 0);

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total Complaints',
            data: totalData,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 0.8)',
            borderWidth: 1
          }]
        },
        options: chartOptions,
        plugins: [ChartDataLabels]
      });
    } else {
      // ✅ Show status-wise details for selected department
      const openData = this.filteredDepStatus.map(item => item.status_counts.OPEN || 0);
      const inProgressData = this.filteredDepStatus.map(item => item.status_counts.IN_PROGRESS || 0);
      const resolvedData = this.filteredDepStatus.map(item => item.status_counts.RESOLVED || 0);
      const closedData = this.filteredDepStatus.map(item => item.status_counts.CLOSED || 0);
      const escalatedData = this.filteredDepStatus.map(item => item.status_counts.ESCALATED || 0);

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Open',
              data: openData,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 0.8)',
              borderWidth: 1
            },
            {
              label: 'In Progress',
              data: inProgressData,
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              borderColor: 'rgba(255, 206, 86, 0.8)',
              borderWidth: 1
            },
            {
              label: 'Resolved',
              data: resolvedData,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 0.8)',
              borderWidth: 1
            },
            {
              label: 'Closed',
              data: closedData,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 0.8)',
              borderWidth: 1
            },
            {
              label: 'Escalated',
              data: escalatedData,
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              borderColor: 'rgba(255, 159, 64, 0.8)',
              borderWidth: 1
            }
          ]
        },
        options: chartOptions,
        plugins: [ChartDataLabels]
      });
    }
  }
  renderPriorityPieChart(): void {
    const canvas = document.getElementById('hodsCharts') as HTMLCanvasElement;
    if (!canvas) return;
  
    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
  
    // ✅ Ensure priority data is present
    if (!this.priority || this.priority.length === 0) return;
  
    const labels = this.priority.map(item => item.priority);
    const data = this.priority.map(item => item.count);
  
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


}  
