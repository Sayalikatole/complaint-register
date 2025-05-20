
import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ✅ UNCOMMENTED

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats, ComplaintPriorityTrend, Cl_getDashboardHodPayload, ComplaintSummaryCategory, TeamLoad } from '../../../services/dashboard.service';
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
export class HODDashboardComponent implements OnInit, OnDestroy {


  // Dummy data: categories with tags
  categories = [
    {
      name: 'Service Quality',
      count: 30,
      tags: [
        { name: 'Wifi Issue', count: 10 },
        { name: 'VPN Issue', count: 20 }
      ]
    },
    {
      name: 'HR Policies',
      count: 20,
      tags: [
        { name: 'Leave', count: 12 },
        { name: 'Increment', count: 8 }
      ]
    },
    {
      name: 'Billing & Payments',
      count: 25,
      tags: [
        { name: 'Late Payment', count: 10 },
        { name: 'Refund', count: 15 }
      ]
    }
  ];

  // Track drilldown state
  drilledDownCategoryIndex: number | null = null;



  selectedCategory: string = '';
  selectedTags: string[] = [];
  currentUser: UserData | null = null;
  dashboardData: Dashboardata[] = [];
  dashDepStatus: DepartmentWiseComplaint[] = [];
  departmentList: DeptmentList[] = [];
  selectedDepartmentId: string = ''; // For ngModel binding
  filteredDepStatus: DepartmentWiseComplaint[] = []; // To hold filtered data

  // Complaints data
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  allComplaintsVisible = false;
visibleComplaints: any[] = [];


  errorMessage: string = '';
  successMessage: string = '';
  private destroy$ = new Subject<void>();
  totalComplaints: any;
  openComplaints: any;
  pendingComplaints: any;
  resolvedComplaints: any;
  avgResolutionTime: any;
  closedComplaints: any;
  statusSummary: Cl_getstatusSummary[] = []
  assignedComplaints: any;
  priority: ComplaintPriorityTrend[] = [];
  complaintSummaryByCategory: ComplaintSummaryCategory[] = [];
  searchTerm: string = '';
filteredCategories: any[] = [];
  expandedCategory: { [key: string]: boolean } = {};
  sortByCount: boolean = true;
  
  avgRating: any;
  chart: any;
  teamLoadData: TeamLoad[] | any;
  showFilter = false;
filterTerm = '';

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

        console.log(user, this.currentUser)
        if (user) {
          // this.renderCategoryChart();
          this.loadMonthlyComplaintTrend();
          this.loadDepartmentTotalCompltStats();
          this.loadgetDashboardComplaintStats();
          this.loadAllDepatList();
          this.loadgetHodPriorityComplaintStatus();
          this.loadComplaints();
          this.loadgetComplaintSummaryByCategoryAndTags();
          this.loadgetHodTeamLoadData()

        }
      });
  }

  // ngAfterViewInit(): void {
  //   // We don't call chart here because the data isn't loaded yet.
  //   // this.loadMonthlyComplaintTrend(); // ✅ passing both arguments
   
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  renderCategoryChart(): void {
    this.drilledDownCategoryIndex = null;
    const ctx = (document.getElementById('chartCanvas') as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    const labels = this.categories.map(c => c.name);
    const data = this.categories.map(c => c.count);

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        }]
      },
      options: {
        responsive: true,
        onClick: (evt, elements) => {
          if (elements.length) {
            this.drilledDownCategoryIndex = elements[0].index;
            this.renderTagChart(this.drilledDownCategoryIndex);
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  renderTagChart(categoryIndex: number): void {
    const ctx = (document.getElementById('chartCanvas') as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    const category = this.categories[categoryIndex];
    const labels = category.tags.map(t => t.name);
    const data = category.tags.map(t => t.count);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: category.name + ' Tags',
          data,
          backgroundColor: '#36A2EB',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  backToCategories(): void {
    this.renderCategoryChart();
  }

  /**
 * Load complaints from the service
 */
  loadComplaints(): void {
    // this.isLoading = true;
    if (!this.currentUser) return;

    console.log(this.currentUser.userId)
    console.log(this.currentUser)
    const userComplaint_data: Cl_getUserComplaintPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
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
          this.updateVisibleComplaints(); 
          console.log(this.filteredComplaints)
          //  this.applyFilters();
          // this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.errorMessage = 'Failed to load complaints. Please try again.';
          // this.isLoading = false;
        }
      });
  }

  applySearchFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
  
    if (!term) {
      this.filteredComplaints = [...this.complaints];
      this.updateVisibleComplaints(); // reset to first 5
    } else {
      this.filteredComplaints = this.complaints.filter(c =>
        (c.subject && c.subject.toLowerCase().includes(term)) ||
        (c.l_department_name && c.l_department_name.toLowerCase().includes(term)) ||
        (c.status && c.status.toLowerCase().includes(term)) || (c.priority && c.priority.toLowerCase().includes(term))
      );
      this.visibleComplaints = [...this.filteredComplaints]; // show all matches
    }
  }
  
  // 👀 Show top 5 initially
  private updateVisibleComplaints(): void {
    const hasSearch = this.filterTerm.trim().length > 0;
  
    if (hasSearch || this.allComplaintsVisible) {
      // Show all filtered complaints when searching or 'View All' is active
      this.visibleComplaints = [...this.filteredComplaints];
    } else {
      // Show only top 5 when not searching and 'View All' is false
      this.visibleComplaints = this.filteredComplaints.slice(0, 5);
    }
  }
  
  
  // setVisibleComplaints(): void {
  //   this.visibleComplaints = this.allComplaintsVisible
  //     ? [...this.filteredComplaints]
  //     : this.filteredComplaints.slice(0, 5);
  //   this.visibleComplaints = [...this.filteredComplaints];
  // }

 

  // loadgetComplaintSummaryByCategoryAndTags(): void {
  //   if (!this.currentUser) return;

  //   const payload: Cl_getDashboardHodPayload = {
  //     org_id: this.currentUser.organizationId,
  //     opr_id: this.currentUser.operatingUnitId,
  //     id: this.currentUser.department_id
  //   };
  
  //   this.dashboardService.getComplaintSummaryByCategoryAndTags(payload)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data) => {
  //         this.complaintSummaryByCategory = data;
  //         this.filteredCategories = data;
  //         console.log(this.complaintSummaryByCategory);
  //       },
  //       error: (err) => {
  //         console.error('Failed to load complaint summary:', err);
  //       }
  //     });
  //   }
    
  //     filterCategories(): void {
  //       const term = this.searchTerm.toLowerCase().trim();
      
  //       this.filteredCategories = this.complaintSummaryByCategory.filter(category =>
  //         category.category_name.toLowerCase().includes(term) ||
  //         category.tags.some(tag => tag.tag_name.toLowerCase().includes(term))
  //       );
  //     }
    
  

 
  
  loadgetComplaintSummaryByCategoryAndTags(): void {
    if (!this.currentUser) return;
  
    const payload: Cl_getDashboardHodPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId,
      id: this.currentUser.department_id
    };
  
    this.dashboardService.getComplaintSummaryByCategoryAndTags(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.complaintSummaryByCategory = data;
  
          // Show top 5 categories by count
          this.filteredCategories = [...data]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        },
        error: (err) => {
          console.error('Failed to load complaint summary:', err);
        }
      });
  }
  
  filterCategories(): void {
    const term = this.searchTerm.toLowerCase().trim();
  
    if (!term) {
      // No search input → show top 5 again
      this.filteredCategories = [...this.complaintSummaryByCategory]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        console.log(this.filteredCategories)
    } else {
      // Show all matching categories/tags
      this.filteredCategories = this.complaintSummaryByCategory.filter(category =>
        category.category_name.toLowerCase().includes(term) ||
        category.tags.some(tag => tag.tag_name.toLowerCase().includes(term))
      );
    }
  }
  


  loadgetHodTeamLoadData(): void {
    if (!this.currentUser) return;

    const payload: Cl_getDashboardHodPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId,
      id: this.currentUser.department_id
    };
  
    this.dashboardService.getHodTeamLoadData(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamLoadData = data;
          console.log(this.teamLoadData);
        },
        error: (err) => {
          console.error('Failed to load complaint summary:', err);
        }
      });
  }


  
  toggleComplaintView(): void {
    this.allComplaintsVisible = !this.allComplaintsVisible;
    this.updateVisibleComplaints();
  }

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


  getMonthName(monthNumber: string): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const index = parseInt(monthNumber, 10) - 1;
    return index >= 0 && index < 12 ? monthNames[index] : 'Invalid';
  }



  loadDepartmentTotalCompltStats(): void {
    console.log(this.currentUser)
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.department_id
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
          // this.avgRating = this.statusSummary.find(item => item.status === 'RESOLVED')?.count || 0;


          console.log(this.statusSummary)
        },
        error: (error) => {
          console.error('Error loading total stats:', error);
          this.errorMessage = 'Failed to load stats.';
        }
      });
  }



  loadAllDepatList(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.department_id

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
      org_id: this.currentUser.organizationId,
      id: this.currentUser.department_id

    };
    console.log(department_data)
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

  loadgetHodPriorityComplaintStatus(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,
      id: this.currentUser.department_id

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



  loadMonthlyComplaintTrend(): void {
    if (!this.currentUser) return;

    const payload: Cl_getDashboardPayload = {
      org_id: this.currentUser.organizationId,
      opr_id: this.currentUser.operatingUnitId,
      id: this.currentUser.department_id
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



  renderDepartmentChart(): void {
    const canvas = document.getElementById('departmentsChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart if exists
    if (Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    // ✅ Make sure data is present
    if (!this.filteredDepStatus || this.filteredDepStatus.length === 0) return;

    const dept = this.filteredDepStatus[0]; // Only one department data expected

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

    // ✅ Extract status-wise data
    const statusCounts = dept.status_counts || {};
    const labels = ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
    const data = [
      statusCounts.OPEN || 0,
      statusCounts.IN_PROGRESS || 0,
      statusCounts.RESOLVED || 0,
      statusCounts.CLOSED || 0,
      statusCounts.ESCALATED || 0
    ];

    const backgroundColors = [
      'rgba(255, 99, 132, 0.2)',       // Open
      'rgba(255, 206, 86, 0.2)',       // In Progress
      'rgba(75, 192, 192, 0.2)',       // Resolved
      'rgba(54, 162, 235, 0.2)',       // Closed
      'rgba(255, 159, 64, 0.2)'        // Escalated
    ];

    const borderColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Complaint Status - ${dept.department_name}`,
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
  
  renderPriorityPieChart(): void {
    const canvas = document.getElementById('hodsCharts') as HTMLCanvasElement;
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    const labels = this.priority.map(item => item.priority);
    const data = this.priority.map(item => item.count);

    const backgroundColors = [
      'rgba(252, 3, 57, 0.81)',       // High
      'rgba(241, 177, 14, 0.7)',      // Medium
      'rgba(54, 163, 235, 0.68)'      // Low
    ];

    const borderColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(54, 162, 235, 0.8)'
    ];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animations: {
          radius: {
            duration: 1000,
            easing: 'easeOutBounce'
          },
          rotate: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#ffffff',
            bodyColor: '#f9fafb'
          },
          legend: {
            position: 'top',
            labels: {
              color: '#374151',
              font: {
                size: 13,
                weight: 'bold' // ✅ This is a valid type
              }
            }
          },
          datalabels: {
            color: '#000000',
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
//  ===========================new code===================================
toggleCategory(categoryId: string): void {
  this.expandedCategory[categoryId] = !this.expandedCategory[categoryId];
}




}  
