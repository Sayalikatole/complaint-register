import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // Form groups
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // User properties
  userId: string = '';
  userRole: string = '';
  userInitials: string = '';
  departmentName: string = '';
  organizationName: string = '';
  profileImage: string | null = null;

  // UI states
  activeTab: 'profile' | 'security' | 'activity' = 'profile';
  loading: boolean = false;
  saveSuccess: boolean = false;
  saveError: boolean = false;
  errorMessage: string = '';
  isDarkMode: boolean = false;

  // Activity data
  lastLoginDate: string = '';
  accountCreatedDate: string = '';
  complaintStats = {
    created: 0,
    resolved: 0,
    pending: 0
  };

  activityLog: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    // private userService: UserService,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
    this.loadActivityData();

    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  /**
   * Initialize all form groups with validators
   */
  initForms(): void {
    // Profile form
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      jobTitle: [''],
      bio: ['', [Validators.maxLength(500)]]
    });

    // Password form with custom validator for password matching
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { 'passwordMismatch': true };
  }

  /**
   * Switch between profile tabs
   */
  switchTab(tab: 'profile' | 'security' | 'activity'): void {
    this.activeTab = tab;

    // Reset success/error messages when switching tabs
    this.saveSuccess = false;
    this.saveError = false;
    this.errorMessage = '';
  }

  /**
   * Load user data from authentication service
   */
  loadUserData(): void {
    this.loading = true;

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userId = currentUser.userId;
      this.userRole = currentUser.role || 'employee';
      this.organizationName = currentUser.l_org_name || 'Organization';
      this.departmentName = currentUser.department_name || 'Department';

      // Get user details from user service
      // this.userService.getUserProfile(this.userId).subscribe({
      //   next: (userData) => {
      //     this.profileForm.patchValue({
      //       firstName: userData.firstName || '',
      //       lastName: userData.lastName || '',
      //       email: userData.email || '',
      //       phone: userData.phoneNumber || '',
      //       jobTitle: userData.jobTitle || '',
      //       bio: userData.bio || ''
      //     });

      //     // Set user initials for avatar
      //     this.userInitials = this.getInitials(userData.firstName, userData.lastName);
      //     this.profileImage = userData.profileImage || null;

      //     this.loading = false;
      //   },
      //   error: (error) => {
      //     console.error('Error loading user data:', error);
      //     this.errorMessage = 'Failed to load user profile';
      //     this.saveError = true;
      //     this.loading = false;
      //   }
      // });
    } else {
      this.loading = false;
      this.errorMessage = 'User not authenticated';
      this.saveError = true;
    }
  }

  /**
   * Load activity data and statistics
   */
  loadActivityData(): void {
    // Sample data - replace with actual API calls
    this.lastLoginDate = '2023-05-10';
    this.accountCreatedDate = '2022-11-15';

    this.complaintStats = {
      created: 12,
      resolved: 8,
      pending: 4
    };

    // Sample activity log
    this.activityLog = [
      {
        title: 'Profile Updated',
        description: 'You updated your profile information',
        date: 'Today',
        time: '10:30 AM',
        status: 'Completed',
        statusBg: 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300',
        iconBg: 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconPath: 'M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z'
      },
      {
        title: 'Logged In',
        description: 'You logged into your account',
        date: 'Today',
        time: '9:15 AM',
        status: 'Completed',
        statusBg: 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300',
        iconBg: 'bg-indigo-100 dark:bg-indigo-800/40',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z'
      },
      {
        title: 'Complaint Created',
        description: 'You created a new complaint',
        date: 'Yesterday',
        time: '3:45 PM',
        status: 'Pending',
        statusBg: 'bg-yellow-100 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-300',
        iconBg: 'bg-yellow-100 dark:bg-yellow-800/40',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconPath: 'M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z'
      },
      {
        title: 'Complaint Resolved',
        description: 'Your complaint was resolved',
        date: 'Last week',
        time: '2:30 PM',
        status: 'Completed',
        statusBg: 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300',
        iconBg: 'bg-green-100 dark:bg-green-800/40',
        iconColor: 'text-green-600 dark:text-green-400',
        iconPath: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
      }
    ];
  }

  /**
   * Update user profile
   */
  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.saveSuccess = false;
    this.saveError = false;

    const profileData = {
      userId: this.userId,
      ...this.profileForm.value
    };

    // this.userService.updateUserProfile(profileData).subscribe({
    //   next: (response) => {
    //     this.loading = false;
    //     this.saveSuccess = true;

    //     // Update initials if name changed
    //     this.userInitials = this.getInitials(
    //       this.profileForm.get('firstName')?.value,
    //       this.profileForm.get('lastName')?.value
    //     );

    //     // Add to activity log
    //     this.addActivityLogEntry('Profile Updated', 'You updated your profile information');

    //     // Auto-hide success message after 3 seconds
    //     setTimeout(() => {
    //       this.saveSuccess = false;
    //     }, 3000);
    //   },
    //   error: (error) => {
    //     this.loading = false;
    //     this.saveError = true;
    //     this.errorMessage = error?.message || 'Failed to update profile';

    //     // Auto-hide error message after 5 seconds
    //     setTimeout(() => {
    //       this.saveError = false;
    //     }, 5000);
    //   }
    // });
  }

  /**
   * Update user password
   */
  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    this.saveSuccess = false;
    this.saveError = false;

    const passwordData = {
      userId: this.userId,
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    // this.userService.updatePassword(passwordData).subscribe({
    //   next: (response) => {
    //     this.loading = false;
    //     this.saveSuccess = true;
    //     this.passwordForm.reset();

    //     // Add to activity log
    //     this.addActivityLogEntry('Password Changed', 'You changed your account password');

    //     // Auto-hide success message after 3 seconds
    //     setTimeout(() => {
    //       this.saveSuccess = false;
    //     }, 3000);
    //   },
    //   error: (error) => {
    //     this.loading = false;
    //     this.saveError = true;
    //     this.errorMessage = error?.message || 'Failed to update password';

    //     // Auto-hide error message after 5 seconds
    //     setTimeout(() => {
    //       this.saveError = false;
    //     }, 5000);
    //   }
    // });
  }

  /**
   * Handle profile image upload
   */
  onFileSelected(event: Event): void {
  }

  removeProfileImage(): void {
    this.profileImage = null;
  }

  // switchTab(tab: 'profile' | 'security' | 'activity'): void {
  //   this.activeTab = tab;
  // }
}