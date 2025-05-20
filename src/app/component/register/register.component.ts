// src/app/component/register/register.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CryptoService } from '../../services/crypto.service';
import { Cl_getDepartmentPayload, DepartmentService } from '../../services/department.service';
import { Role, Organization, OperatingUnit } from '../../models/auth';
import { Department } from '../../models/department';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  // Form fields
  fullName: string = '';
  email: string = '';
  phoneNumber: string = '';
  password: string = '';
  confirmPassword: string = '';
  selectedl_department_Id: string = '';
  selectedRoleId: string = '';
  selectedOrganizationId: string = '';
  selectedOperatingUnitId: number = 0;

  // Visibility toggles
  showRegPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Data lists
  departments: Department[] = [];
  roles: Role[] = [];
  organizations: Organization[] = [];
  operatingUnits: OperatingUnit[] = [];
  filteredOperatingUnits: OperatingUnit[] = [];

  // Error and success states
  errorMessage: string = '';
  successMessage: string = '';
  passwordMismatchError: boolean = false;
  
  // Event emitters to communicate with parent component
  @Output() registerSuccess = new EventEmitter<string>();
  @Output() registerError = new EventEmitter<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private cryptoService: CryptoService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadRoles();
    this.loadOrganizations();
    this.loadOperatingUnits();
  }

  // Load dropdown data methods
  loadDepartments(): void {
    const department_data: Cl_getDepartmentPayload = {
      opr_id: '1',
      org_id: '1'
    };

    this.departmentService.getDepartments(department_data).subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.errorMessage = 'Failed to load departments. Please try again.';
        this.registerError.emit(this.errorMessage);
      }
    });
  }

  loadRoles(): void {
    this.authService.getRoles('1', '1').subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.errorMessage = 'Failed to load roles. Please try again.';
        this.registerError.emit(this.errorMessage);
      }
    });
  }

  loadOrganizations(): void {
    this.authService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations = data;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.errorMessage = 'Failed to load organizations. Please try again.';
        this.registerError.emit(this.errorMessage);
      }
    });
  }

  loadOperatingUnits(): void {
    this.authService.getOperatingUnits().subscribe({
      next: (data) => {
        this.operatingUnits = data;
        this.filterOperatingUnits();
      },
      error: (error) => {
        console.error('Error loading operating units:', error);
        this.errorMessage = 'Failed to load operating units. Please try again.';
        this.registerError.emit(this.errorMessage);
      }
    });
  }

  filterOperatingUnits(): void {
    if (!this.selectedOrganizationId) {
      this.filteredOperatingUnits = [];
      return;
    }

    const org_id = parseInt(this.selectedOrganizationId);
    this.filteredOperatingUnits = this.operatingUnits.filter(unit => unit.org_id === org_id);
  }

  onOrganizationChange(): void {
    this.filterOperatingUnits();
    this.selectedOperatingUnitId = 0; // Reset selected operating unit
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.passwordMismatchError = true;
      this.errorMessage = 'Passwords do not match!';
      this.registerError.emit(this.errorMessage);
      return;
    } else {
      this.passwordMismatchError = false;
    }

    // Basic validation
    if (!this.fullName || !this.email || !this.phoneNumber || !this.password) {
      this.errorMessage = 'Please fill all required fields.';
      this.registerError.emit(this.errorMessage);
      return;
    }

    // Prepare registration data
    const registerData = {
      account_id: '',
      name: this.fullName,
      email: this.email,
      phone_no: this.phoneNumber,
      password: this.password,
      department_id: this.selectedl_department_Id || '8977304036509213', // Using default if not selected
      role_id: this.selectedRoleId || "9065837334047421", // Using default if not selected
      org_id: this.selectedOrganizationId.toString() || '1',
      opr_id: this.selectedOperatingUnitId.toString() || '1',
      created_by: this.authService.getUserId() || 'd4b8ca35df954910', // Use current user ID if available
      created_on: '',
      modified_by: '',
      modified_on: '',
      is_active: 'YES'
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.successMessage = 'User registered successfully!';
        this.registerSuccess.emit(this.successMessage);
        this.resetForm();
      },
      error: (error) => {
        console.error('Registration failed', error);
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.registerError.emit(this.errorMessage);
      }
    });
  }
  
  resetForm(): void {
    this.fullName = '';
    this.email = '';
    this.phoneNumber = '';
    this.password = '';
    this.confirmPassword = '';
    this.selectedl_department_Id = '';
    this.selectedRoleId = '';
    this.selectedOrganizationId = '';
    this.selectedOperatingUnitId = 0;
    this.passwordMismatchError = false;
  }
}