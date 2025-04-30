import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  showNewDropdown = false;
  role: string | null = null;
  username: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get user role and other data
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.role = user.role;
        this.username = user.username;
      }
    });
  }

  // Toggle the New dropdown menu
  toggleNewDropdown(): void {
    this.showNewDropdown = !this.showNewDropdown;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close dropdown if clicking outside of it
    if (!target.closest('.relative') && this.showNewDropdown) {
      this.showNewDropdown = false;
    }
  }

  // Handle logout
  logout(): void {
    this.authService.logout();
  }

  // Get initials for the user avatar
  get userInitials(): string {
    if (this.username) {
      // Get first letter of first and last name
      const names = this.username.split(' ');
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      // If only one name, get first two letters or just first letter
      return this.username.length > 1
        ? this.username.substring(0, 2).toUpperCase()
        : this.username[0].toUpperCase();
    }
    return 'U'; // Default
  }
}