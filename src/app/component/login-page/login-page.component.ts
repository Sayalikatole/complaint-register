// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {MatCardModule} from '@angular/material/card';
// import {MatFormFieldModule} from '@angular/material/form-field';
// import {MatSelectModule} from '@angular/material/select';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import {MatButtonModule} from '@angular/material/button';

// import {MatIconModule} from '@angular/material/icon';
// import {MatInputModule} from '@angular/material/input';




// @Component({
//   selector: 'app-login-page',
//   standalone: true,
//   imports: [CommonModule,MatCardModule,MatFormFieldModule,MatSelectModule,MatIconModule,MatInputModule,ReactiveFormsModule,MatButtonModule
//   ],
//   templateUrl: './login-page.component.html',
//   styleUrl: './login-page.component.scss'
// })
// export class LoginPageComponent {

//   isLoginPage: boolean = true; // true => Login page, false => Register page

//   username: string = '';
//   password: string = '';
//   role: string = ''; // Only for register



//   // isLogin = true;
//   // authForm: FormGroup;

//   // constructor(private fb: FormBuilder) {
//   //   this.authForm = this.fb.group({
//   //     username: ['', Validators.required],
//   //     password: ['', Validators.required],
//   //     email: [''],
//   //     role: ['']
//   //   });
//   // }

//   // toggleForm() {
//   //   this.isLogin = !this.isLogin;
//   //   this.authForm.reset();
//   // }

//   // onSubmit() {
//   //   if (this.authForm.valid) {
//   //     console.log(this.isLogin ? 'Login Data' : 'Register Data', this.authForm.value);
//   //   }
//   // } 

// //   isLogin = true;

// // loginForm = this.fb.group({
// //   email: [''],
// //   password: ['']
// // });

// // registerForm = this.fb.group({
// //   username: [''],
// //   email: [''],
// //   password: [''],
// //   role: ['']
// // });

// // constructor(private fb: FormBuilder) {}

// // toggleForm(event: Event) {
// //   event.preventDefault();
// //   this.isLogin = !this.isLogin;
// // }

// // onLogin() {
// //   console.log(this.loginForm.value);
// //   // add your login logic here
// // }

// // onRegister() {
// //   console.log(this.registerForm.value);
// //   // add your register logic here
// // }


// // ======================WITH TAILWIND CSS==============
// // currentForm: 'login' | 'register' = 'login';
// // loginForm: FormGroup;
// // registerForm: FormGroup;

// // constructor(private fb: FormBuilder) {
// //   this.loginForm = this.fb.group({
// //     username: ['', Validators.required],
// //     password: ['', Validators.required]
// //   });

// //   this.registerForm = this.fb.group({
// //     username: ['', Validators.required],
// //     email: ['', [Validators.required, Validators.email]],
// //     password: ['', Validators.required],
// //     role: ['User', Validators.required]
// //   });
// // }

// // showForm(form: 'login' | 'register') {
// //   this.currentForm = form;
// // }

// // onLogin() {
// //   if (this.loginForm.valid) {
// //     console.log('Login Data:', this.loginForm.value);
// //     // Add login API call here
// //   }
// // }

// // onRegister() {
// //   if (this.registerForm.valid) {
// //     console.log('Register Data:', this.registerForm.value);
// //     // Add register API call here
// //   }
// // }
// constructor() {}

//   togglePage(): void {
//     this.isLoginPage = !this.isLoginPage;
//     this.clearFields();
//   }

//   clearFields(): void {
//     this.username = '';
//     this.password = '';
//     this.role = '';
//   }

//   onSubmit(): void {
//     if (this.isLoginPage) {
//       console.log('Logging in with:', this.username, this.password);
//       // Call login API here
//     } else {
//       console.log('Registering with:', this.username, this.password, this.role);
//       // Call register API here
//     }
//   }

// }

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { Role, Organization, OperatingUnit, LoginRequest, RegisterRequest } from '../../models/auth';
import { Department, DepartmentRequest } from '../../models/department';
import { Cl_getDepartmentPayload, DepartmentService } from '../../services/department.service';
import { CryptoService } from '../../services/crypto.service';


@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit, OnDestroy {
  // Form display state
  isLoginPage: boolean = true;

  // Common form fields
  email: string = '';
  password: string = '';

  // Register form fields
  confirmPassword: string = '';
  fullName: string = '';
  phoneNumber: string = '';
  selectedl_department_Id: string = '';
  selectedRoleId: string = '';
  selectedOrganizationId: string = '';
  selectedOperatingUnitId: number = 0;

  // Data lists
  departments: Department[] = [];
  roles: Role[] = [];
  organizations: Organization[] = [];
  operatingUnits: OperatingUnit[] = [];
  filteredOperatingUnits: OperatingUnit[] = [];

  // Error messages
  errorMessage: string = '';
  passwordMismatchError: boolean = false;

  // For unsubscribing from observables
  private destroy$ = new Subject<void>();

  showPassword: boolean = false;
  showRegPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private cryptoService: CryptoService
  ) { }

  /**
   * Initialize the component and prefetch data if needed
   */
  ngOnInit(): void {
    // We'll load data when needed, not eagerly
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle between login and register pages
   * Load necessary data for registration when switching to register view
   */
  togglePage(): void {
    this.isLoginPage = !this.isLoginPage;
    this.clearFields();
    this.errorMessage = '';

    if (!this.isLoginPage) {
      this.loadRegistrationData();
    }
  }

  /**
   * Clear all form fields and error messages
   */
  clearFields(): void {
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.fullName = '';
    this.phoneNumber = '';
    this.selectedl_department_Id = '';
    this.selectedRoleId = '';
    this.errorMessage = '';
    this.passwordMismatchError = false;
  }

  /**
   * Load all data needed for registration form
   */
  loadRegistrationData(): void {
    this.loadDepartments();
    this.loadRoles();
    this.loadOrganizations();
    this.loadOperatingUnits();
  }

  /**
   * Load departments from API
   */
  loadDepartments(): void {
    // Using default org and opr ids - should be updated based on selection

    const department_data: Cl_getDepartmentPayload = {
      oprId: '1',
      orgId: '1'
    };

    this.departmentService.getDepartments(department_data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
        },
        error: (error) => {
          console.error('Error loading departments:', error);
          this.errorMessage = 'Failed to load departments. Please try again.';
        }
      });
  }

  /**
   * Load roles from API
   */
  loadRoles(): void {
    this.authService.getRoles('1', '1')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.roles = data;
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.errorMessage = 'Failed to load roles. Please try again.';
        }
      });
  }

  /**
   * Load organizations from API
   */
  loadOrganizations(): void {
    this.authService.getOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.organizations = data;
        },
        error: (error) => {
          console.error('Error loading organizations:', error);
          this.errorMessage = 'Failed to load organizations. Please try again.';
        }
      });
  }

  /**
   * Load operating units from API
   */
  loadOperatingUnits(): void {
    this.authService.getOperatingUnits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.operatingUnits = data;
          this.filterOperatingUnits();
        },
        error: (error) => {
          console.error('Error loading operating units:', error);
          this.errorMessage = 'Failed to load operating units. Please try again.';
        }
      });
  }

  /**
   * Filter operating units based on selected organization
   */
  filterOperatingUnits(): void {
    if (!this.selectedOrganizationId) {
      this.filteredOperatingUnits = [];
      return;
    }

    const orgId = parseInt(this.selectedOrganizationId);
    this.filteredOperatingUnits = this.operatingUnits.filter(unit => unit.org_id === orgId);
  }

  /**
   * Handle organization selection change
   */
  onOrganizationChange(): void {
    this.filterOperatingUnits();
    this.selectedOperatingUnitId = 0; // Reset selected operating unit
  }

  /**
   * Submit form handler - determines whether to login or register
   */
  onSubmit(): void {
    this.errorMessage = '';

    if (this.isLoginPage) {
      this.handleLogin();
    } else {
      this.handleRegistration();
    }
  }

  /**
   * Process login with validation
   */
  handleLogin(): void {
    // Validate input
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    // Encrypt the password before sending
    const encryptedPassword = this.cryptoService.encrypt(this.password);

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {


            // Navigate based on role
            if (response.role === '1406827783519433') {  // Admin role ID
              this.router.navigate(['/admin/complaints']);
            } else if (response.role === '9816063224382954') {  // User role ID (Client)
              this.router.navigate(['/client/complaints']);
            }
            else if (response.role === '9381190731754782') {  // hod role ID (Client)
              this.router.navigate(['/hod/complaints']);
            }
            else if (response.role === '8513155895269752') {  // employee role ID (Client)
              this.router.navigate(['/employee/complaints']);
            }
            else {
              this.errorMessage = 'Unknown role! Cannot login.';
            }
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
          }
        },
        error: (error) => {
          console.error('Login API error', error);
          this.errorMessage = error.error?.message || 'Server error. Please try again later.';
        }
      });
  }

  /**
   * Process registration with validation
   */
  handleRegistration(): void {
    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.passwordMismatchError = true;
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    // Basic validation
    if (!this.fullName || !this.email || !this.phoneNumber || !this.password) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    // Encrypt the password before sending
    const encryptedPassword = this.cryptoService.encrypt(this.password);
    // Alternatively, use hashing instead of encryption
    // const hashedPassword = this.cryptoService.hashPassword(this.password);

    const registerData: RegisterRequest = {
      name: this.fullName,
      email: this.email,
      phoneNo: this.phoneNumber,
      password: this.password,
      l_department_Id: this.selectedl_department_Id || '8977304036509213', // Using default if not selected
      roleId: this.selectedRoleId || "9065837334047421", // Using default if not selected
      orgId: this.selectedOrganizationId.toString() || '1',
      oprId: this.selectedOperatingUnitId.toString() || '1',
      createdBy: 'admin'
    };

    this.authService.register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          alert('Registered successfully! Please login.');
          this.togglePage();  // After register, show login form
        },
        error: (error) => {
          console.error('Registration failed', error);
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
  }
}