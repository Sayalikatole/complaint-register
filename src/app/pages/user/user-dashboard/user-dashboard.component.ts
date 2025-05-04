import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { Cl_getDashboardPayload, Dashboardata, DashboardService } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth.service';
import { Subject,takeUntil } from 'rxjs';
import { UserData } from '../../../models/auth';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent {
  // Current user data
  currentUser: UserData | null = null;
  dashboardData: Dashboardata[] = [];

  // Error messages
  errorMessage: string = '';
  successMessage: string = '';
  
  private destroy$ = new Subject<void>();
 constructor( private dashboardService: DashboardService,
  private authService: AuthService){}

  ngOnInit(): void {
    // this.loadDepartmentTotalCompltStats();

    // Get current user data
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;

        if (user) {
          // Load departments after getting user data
          // this.loadDepartmentTotalCompltStats();
          // this.generateNewDepartmentId();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

 
}
