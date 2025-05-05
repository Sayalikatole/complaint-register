// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
// private tokenKey = 'auth_token';
// private roleKey = 'user_role';
// private timeoutId: any;
// private sessionDuration = 60 * 60 * 1000; // 1 hour session

//   constructor(private router: Router) {}

//   // Save token and role
//   login(token: string, role: string): void {
//     localStorage.setItem(this.tokenKey, token);
//     localStorage.setItem(this.roleKey, role);
//     this.startSessionTimer();
//   }

//   // Check if logged in
//   isLoggedIn(): boolean {
//     return !!localStorage.getItem(this.tokenKey);
//   }

//   // Get token
// getToken(): string | null {
//   return localStorage.getItem(this.tokenKey);
// }

//   // Get current user role
// getUserRole(): string | null {
//   return localStorage.getItem(this.roleKey);
// }

//   // Logout user
// logout(): void {
//   localStorage.removeItem(this.tokenKey);
//   localStorage.removeItem(this.roleKey);
//   this.clearSessionTimer();
//   this.router.navigate(['/login']);
//   alert('Session expired or logout. Please login again.');
// }

//   // Start auto-logout timer
//   startSessionTimer(): void {
//     this.clearSessionTimer();
//     this.timeoutId = setTimeout(() => {
//       this.logout();
//     }, this.sessionDuration);
//   }

//   // Clear timer
//   clearSessionTimer(): void {
//     if (this.timeoutId) {
//       clearTimeout(this.timeoutId);
//     }
//   }
// }




/**
 * Interface for current user data
 */
// export interface UserData {
//   userId: string;
//   username: string;
//   email: string;
//   role: string;
//   token: string;
//   l_department_Id?: string;
//   organizationId?: string;
//   operatingUnitId?: string;
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserData, LoginRequest, LoginResponse, RegisterRequest, Role, Organization, OperatingUnit, UserByDepartment } from '../models/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://192.168.1.36:8081/api';

  // Storage keys
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private userIdKey = 'user_id';
  private usernameKey = 'username';
  private org_idKey = 'org_id';
  private opr_idKey = 'opr_id';
  private l_role_name = 'l_role_name';
  private l_org_name = 'l_org_name';
  private l_department_Id = 'l_department_Id';
  private l_department_name = 'l_department_name';

  // Session management
  private timeoutId: any;
  private sessionDuration = 60 * 60 * 1000; // 1 hour session

  // BehaviorSubject to track current user data across the application
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize the behavior subject with stored user data (if any)
    this.initUserFromStorage();
  }

  /**
   * Initialize user data from localStorage on service creation
   * This ensures user data persists across page refreshes
   */
  private initUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const userData: UserData = {
        userId: localStorage.getItem(this.userIdKey) || '',
        username: localStorage.getItem(this.usernameKey) || '',
        email: '',  // We don't usually store email in localStorage for security
        role: localStorage.getItem(this.roleKey) || '',
        token: token,
        organizationId: localStorage.getItem(this.org_idKey) || '',
        operatingUnitId: localStorage.getItem(this.opr_idKey) || '',
        l_role_name: localStorage.getItem(this.l_role_name) || '',
        l_org_name: localStorage.getItem(this.l_org_name) || '',
        department_id: localStorage.getItem(this.l_department_Id) || '',
        department_name: localStorage.getItem(this.l_department_name) || '',
        account_id: ''
      };
      this.currentUserSubject.next(userData);
      this.startSessionTimer();
    }
  }

  /**
   * Authenticate user with credentials
   * @param loginData Login credentials
   * @returns Observable with login response
   */
  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, loginData)
      .pipe(
        tap(response => {
          if (response.success) {
            // Store authentication data
            this.storeUserData(response);

            // Update the behavior subject
            const userData: UserData = {
              userId: response.userId,
              username: response.username,
              email: loginData.email,
              role: response.role,
              token: response.token,
              organizationId: response.org_id,
              operatingUnitId: response.opr_id,
              l_org_name: response.l_org_name,
              l_role_name: response.l_role_name,
              department_id: response.l_department_Id,
              department_name: response.l_department_name,
              account_id: ''
            };
            this.currentUserSubject.next(userData);

            // Start session timer
            this.startSessionTimer();
          }
        })
      );
  }

  /**
   * Store user authentication data in localStorage
   * @param response Login response data
   */
  private storeUserData(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.roleKey, response.role);
    localStorage.setItem(this.userIdKey, response.userId);
    localStorage.setItem(this.usernameKey, response.username);
    localStorage.setItem(this.org_idKey, response.org_id.toString());
    localStorage.setItem(this.opr_idKey, response.opr_id.toString());
    localStorage.setItem(this.l_role_name, response.l_role_name.toString());
    localStorage.setItem(this.l_org_name, response.l_org_name.toString());
  }

  /**
   * Register a new user
   * @param registerData Registration information
   * @returns Observable with registration response
   */
  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, registerData);
  }

  /**
   * Get all roles for the given organization and operating unit
   * @param org_id Organization ID
   * @param opr_id Operating Unit ID
   * @returns Observable with roles list
   */
  getRoles(org_id: string, opr_id: string): Observable<Role[]> {
    const payload = { org_id, opr_id };
    return this.http.post<Role[]>(`${this.baseUrl}/roles/getAllRole`, payload);
  }

  /**
   * Get all organizations
   * @returns Observable with organizations list
   */
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.baseUrl}/organdopr/getAllOrgs`);
  }

  /**
   * Get all operating units
   * @returns Observable with operating units list
   */
  getOperatingUnits(): Observable<OperatingUnit[]> {
    return this.http.get<OperatingUnit[]>(`${this.baseUrl}/organdopr/getAllOprs`);
  }

  /**
   * Get current user's role
   * @returns User role or null if not logged in
   */
  getUserRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  /**
   * Get current user's authentication token
   * @returns Auth token or null if not logged in
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current user's ID
   * @returns User ID or null if not logged in
   */
  getUserId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }

  /**
   * Get current user's username
   * @returns Username or null if not logged in
   */
  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  /**
   * Get current user's organization ID
   * @returns Organization ID or null if not logged in
   */
  getOrganizationId(): number | null {
    const org_id = localStorage.getItem(this.org_idKey);
    return org_id ? parseInt(org_id) : null;
  }

  /**
   * Get current user's operating unit ID
   * @returns Operating unit ID or null if not logged in
   */
  getOperatingUnitId(): number | null {
    const opr_id = localStorage.getItem(this.opr_idKey);
    return opr_id ? parseInt(opr_id) : null;
  }

  /**
   * Check if user is authenticated
   * @returns True if user is logged in, false otherwise
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current user data snapshot
   * @returns Current user data or null if not logged in
   */
  getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  /**
   * Updates part of the current user data
   * @param userData Partial user data to update
   */
  updateUserData(userData: Partial<UserData>): void {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.currentUserSubject.next(updatedUser);

      // Also update localStorage if applicable
      if (userData.token) localStorage.setItem(this.tokenKey, userData.token);
      if (userData.role) localStorage.setItem(this.roleKey, userData.role);
      if (userData.userId) localStorage.setItem(this.userIdKey, userData.userId);
      if (userData.username) localStorage.setItem(this.usernameKey, userData.username);
      if (userData.organizationId) localStorage.setItem(this.org_idKey, userData.organizationId.toString());
      if (userData.operatingUnitId) localStorage.setItem(this.opr_idKey, userData.operatingUnitId.toString());
    }
  }

  /**
   * Log out the current user
   * Clear session and navigate to login page
   */
  logout(): void {
    // Clear localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.usernameKey);
    localStorage.removeItem(this.org_idKey);
    localStorage.removeItem(this.opr_idKey);

    // Clear behavior subject
    this.currentUserSubject.next(null);

    // Clear session timer
    this.clearSessionTimer();

    // Navigate to login page
    this.router.navigate(['/login']);

    // alert('Session expired or logout. Please login again.');
  }

  /**
   * Start auto-logout timer
   */
  startSessionTimer(): void {
    this.clearSessionTimer();
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, this.sessionDuration);
  }

  /**
   * Clear auto-logout timer
   */
  clearSessionTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }



  /**
 * Get users who can be assigned to complaints
 */
  getAssignableUsers(getAssignableUsers: Cl_getAssignableUsers): Observable<UserByDepartment[]> {
    return this.http.post<UserByDepartment[]>(`${this.baseUrl}/auth/getUserByDepartment`, getAssignableUsers);
  }

  /**
   * Update the assignee of a complaint
   */
  updateAssignee(complaintId: string, userId: string | null): Observable<any> {
    return this.http.post(`${this.baseUrl}/complaint/update-assignee`, {
      complaintId: complaintId,
      assignedTo: userId
    });
  }
}


export interface Cl_getAssignableUsers {
  org_id: string,
  opr_id: string,
  id: string,
}