// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import Chart from 'chart.js/auto';
// import { Cl_getDashboardPayload, Dashboardata, DashboardService } from '../../../services/dashboard.service';
// import { AuthService } from '../../../services/auth.service';
// import { Subject,takeUntil } from 'rxjs';
// import { UserData } from '../../../models/auth';

// @Component({
//   selector: 'app-user-dashboard',
//   standalone: true,
//   imports: [CommonModule,FormsModule],
//   templateUrl: './user-dashboard.component.html',
//   styleUrl: './user-dashboard.component.scss'
// })
// export class UserDashboardComponent {
//   // Current user data
//   currentUser: UserData | null = null;
//   dashboardData: Dashboardata[] = [];

//   // Error messages
//   errorMessage: string = '';
//   successMessage: string = '';

//   private destroy$ = new Subject<void>();
//  constructor( private dashboardService: DashboardService,
//   private authService: AuthService){}

//   ngOnInit(): void {
//     // this.loadDepartmentTotalCompltStats();

//     // Get current user data
//     this.authService.currentUser$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(user => {
//         this.currentUser = user;

//         if (user) {
//           // Load departments after getting user data
//           // this.loadDepartmentTotalCompltStats();
//           // this.generateNewDepartmentId();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   ngAfterViewInit() {
//     const ctx = document.getElementById('ticketStatusChart') as HTMLCanvasElement;

//     new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels: ['Resolved', 'In Progress', 'Open'],
//         datasets: [{
//           label: 'Tickets',
//           data: [27, 14, 7],
//           backgroundColor: ['#10B981', '#FBBF24', '#EF4444'],
//           borderColor: ['#059669', '#D97706', '#DC2626'],
//           borderWidth: 1,
//           borderRadius: 5, // adds rounded corners
//           hoverBackgroundColor: ['#059669', '#D97706', '#DC2626'],
//           hoverBorderColor: '#000',
//           hoverBorderWidth: 2
//         }]
//       },
//       options: {
//         responsive: true,
//         animation: {
//           duration: 1500,
//           easing: 'easeOutElastic'
//         },
//         interaction: {
//           mode: 'nearest',
//           intersect: true
//         },
//         scales: {
//           y: {
//             beginAtZero: true
//           }
//         },
//         plugins: {
//           legend: {
//             display: false
//           },
//           tooltip: {
//             backgroundColor: '#111827',
//             titleColor: '#fff',
//             bodyColor: '#f9fafb',
//             borderWidth: 1,
//             borderColor: '#9ca3af',
//             cornerRadius: 6
//           }
//         }
//       }
//     });
//   }


// }




import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ✅ UNCOMMENTED

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats, Cl_getClientDashboardPayload } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Register chart.js components and plugin
Chart.register(...registerables);
Chart.register(ChartDataLabels);


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
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
  userMonthStatusChartInstance: any;
  ticketStatusChartInstance: any;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        console.log(user, this.currentUser)
        if (user) {
          this.loadUserTotalCompltStats();
          this.loadgetDashboardComplaintStats();
          this.loadAllDepatList();
        }
      });
  }

  ngAfterViewInit(): void {
    // We don't call chart here because the data isn't loaded yet.
    this.loadMonthlyUserComplaintTrend(); // ✅ passing both arguments
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



 

  
  




  // dashboard.component.ts
loadUserTotalCompltStats(): void {
  if (!this.currentUser) return;

  const userPayload: Cl_getClientDashboardPayload = {
    opr_id: this.currentUser.operatingUnitId,
    org_id: this.currentUser.organizationId,
    id: this.currentUser.userId
  };

  this.dashboardService.getClientTotalCompltStats(userPayload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.totalComplaints = data.totalComplaintCount;
        this.avgResolutionTime = data.avgResolutionTimeInHours ?? 0;

        const countMap = data.statusWiseCount || {};

        this.openComplaints = countMap['OPEN'] || 0;
        this.pendingComplaints = countMap['IN_PROGRESS'] || 0;
        this.resolvedComplaints = countMap['RESOLVED'] || 0;
        this.assignedComplaints = countMap['ASSIGNED'] || 0;
        this.closedComplaints = countMap['CLOSED'] || 0;
        this.reopenComplaints = countMap['REOPEN'] || 0;
        this.defferedComplaints = countMap['DEFERRED'] || 0;
        this.escalatedComplaints = countMap['ESCALATED'] || 0;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
        this.errorMessage = 'Failed to load user stats.';
      }
    });
}




  loadAllDepatList(): void {
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      opr_id: this.currentUser.operatingUnitId,
      org_id: this.currentUser.organizationId,

    };

    this.dashboardService.getAllDepatList(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departmentList = data;
          console.log(this.departmentList)
          // this.renderDepartmentChart(); // call chart only when data is ready
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
      id: this.currentUser.userId

    };

    this.dashboardService.getDashboardComplaintStats(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashDepStatus = data;
          this.filteredDepStatus = data; // Default to full list
          // this.renderDepartmentChart(); // call chart only when data is ready
        },
        error: (error) => {
          console.error('Error loading complaint stats:', error);
          this.errorMessage = 'Failed to load department complaints.';
        }
      });
  }

  loadMonthlyUserComplaintTrend(): void {
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
  
          this.renderMonthlyComplaintChart(labels, data);
        },
        error: (err) => {
          console.error('Error fetching monthly trend data:', err);
          this.errorMessage = 'Failed to load monthly complaint trend.';
        }
      });
  }
  
  renderMonthlyComplaintChart(labels: string[], data: (number | null)[]): void {
    const canvas = document.getElementById('ticketStatusChart') as HTMLCanvasElement;
  
    if (!canvas) return;
  
    if (this.ticketStatusChartInstance) {
      this.ticketStatusChartInstance.destroy(); // destroy previous chart if any
    }
  
    this.ticketStatusChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Complaints',
            data: data,
            borderColor: '#3B82F6', // Tailwind blue
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#3B82F6',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Complaints'
            },
            ticks: {
              stepSize: 1
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

  

}  
