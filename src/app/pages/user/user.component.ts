// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-user',
//   standalone: true,
//   imports: [],
//   templateUrl: './user.component.html',
//   styleUrl: './user.component.scss'
// })
// export class UserComponent {

// }
import { Component, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements AfterViewInit {

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
