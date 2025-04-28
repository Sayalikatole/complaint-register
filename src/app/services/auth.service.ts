import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private timeoutId: any;
  private sessionDuration = 60 * 60 * 1000; // 1 hour session

  constructor(private router: Router) {}

  // Save token and role
  login(token: string, role: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.roleKey, role);
    this.startSessionTimer();
  }

  // Check if logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get current user role
  getUserRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.clearSessionTimer();
    this.router.navigate(['/login']);
    alert('Session expired or logout. Please login again.');
  }

  // Start auto-logout timer
  startSessionTimer(): void {
    this.clearSessionTimer();
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, this.sessionDuration);
  }

  // Clear timer
  clearSessionTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
