import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ✅ UNCOMMENTED

import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';
import { AuthService } from '../../../services/auth.service';
import { Dashboardata, DashboardService, Cl_getDashboardPayload, DepartmentWiseComplaint, DeptmentList, Cl_getstatusSummary, ComplaintCategoryStats } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Register chart.js components and plugin
Chart.register(...registerables);
Chart.register(ChartDataLabels);


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule],
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
  openComplaints: any;
  pendingComplaints: any;
  resolvedComplaints: any;
  avgResolutionTime: any;
  closedComplaints: any;
  statusSummary: Cl_getstatusSummary[] = []
  assignedComplaints: any;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
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

    // Destroy existing chart if needed (optional if you're rendering multiple times)
    if ((Chart as any).instances?.length) {
      (Chart as any).instances.forEach((instance: any) => instance.destroy());
    }

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Complaints per Month',
          data: data,
          fill: false,
          borderColor: '#3b82f6',
          tension: 0.3,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#374151' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
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
    if (!this.currentUser) return;

    const department_data: Cl_getDashboardPayload = {
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId
    };

    this.dashboardService.getAdminTotalCompltStats(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {

          this.totalComplaints = data.totalComplaints
          this.avgResolutionTime = data.avgResolutionTime
          this.statusSummary = data.statusSummary
          this.openComplaints = this.statusSummary.find(item => item.status === 'OPEN')?.count || 0;
          this.pendingComplaints = this.statusSummary.find(item => item.status === 'IN_PROGRESS')?.count || 0;
          this.resolvedComplaints = this.statusSummary.find(item => item.status === 'RESOLVED')?.count || 0;
          this.assignedComplaints = this.statusSummary.find(item => item.status === 'ASSIGNED')?.count || 0;
          this.closedComplaints = this.statusSummary.find(item => item.status === 'CLOSED')?.count || 0;
          // this.resolvedComplaints = this.statusSummary.find(item => item.status === 'RESOLVED')?.count || 0;


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
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId
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
      oprId: this.currentUser.operatingUnitId,
      orgId: this.currentUser.organizationId
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
      orgId: this.currentUser.organizationId,
      oprId: this.currentUser.operatingUnitId
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

}  
