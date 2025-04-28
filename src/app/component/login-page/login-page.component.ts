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


import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

  isLoginPage: boolean = true;

  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: any[] = [];
  name: string = '';
  email: string = '';
  phoneNo: string = '';
  departmentId: string = '';
  roleId: string = '';
  isActive: boolean = false;
  organization_list: any[] = [];
  organizationid: string = "";
  operating_unit_list: any[] = [];
  operating_unit_id: number = 0;
  filtered_operating_list:any[] =[];

  departments: any[] = [];



  constructor(private router: Router, private http: HttpClient) { }  // Inject Router

  ngOnInit(): void {

  }

  togglePage(): void {
    this.isLoginPage = !this.isLoginPage;
    this.clearFields();
    // if (!this.departments) {
      this.ongetDepartment();
    // }
    // if (!this.role) {
      this.ongetRoleList();
    // }
    // if (!this.organization_list) {
      this.ongetOrganizationList();
    // }
    // if (!this.operating_unit_list) {
      this.ongetOPeratingUnitList();
    // }

  }

  clearFields(): void {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    // this.role = '';
  }

  onSubmit(): void {
    if (this.isLoginPage) {
      this.login();
    } else {
      this.register();
    }
  }

  login(): void {
    console.log('Login with', { email: this.username, password: this.password });

    const loginPayload = {
      email: this.email,
      password: this.password
    };

    this.http.post('http://192.168.1.36:8081/api/auth/login', loginPayload)
      .subscribe({
        next: (response: any) => {
          console.log('Login successful:', response);

          if (response.success) {
            // Save important details
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userId', response.userId);
            localStorage.setItem('role', response.role);
            localStorage.setItem('username', response.username);

            // Navigate based on role
            if (response.role === '9065837334047421') {  // Assuming 9065837334047421 is admin role ID
              this.router.navigate(['/admin/dashboard']);
            } else if (response.role === 'another-department-role-id') {
              this.router.navigate(['/department/home']);
            } else {
              alert('Unknown role! Cannot login.');
            }
          } else {
            alert('Login failed: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Login API error', error);
          alert('Login failed: ' + (error.error?.message || 'Server error'));
        }
      });
  }


  ongetDepartment(): void {
    const payload = {
      orgId: "1",
      oprId: "1"
    };

    // Make the HTTP POST request
    this.http.post<any>('http://192.168.1.36:8081/api/departments/getAllDepartment', payload).subscribe(
      response => {
        if (response) {
          // Assuming response.data contains the department list
          this.departments = response;
          console.log(this.departments)
        } else {
          // Handle failure
          console.error('Error fetching departments:', response.message);
        }
      },
      error => {
        // Handle error
        console.error('API Error:', error);
      }
    );
  }


  ongetOrganizationList(): void {
    const payload = {
      // orgId: "1",
      // oprId: "1"
    };

    // Make the HTTP POST request
    this.http.get<any>('http://192.168.1.36:8081/api/organdopr/getAllOrgs', payload).subscribe(
      response => {
        if (response) {
          // Assuming response.data contains the department list
          this.organization_list = response;
          console.log(this.organization_list)
        } else {
          // Handle failure
          console.error('Error fetching departments:', response.message);
        }
      },
      error => {
        // Handle error
        console.error('API Error:', error);
      }
    );
  }

  ongetOPeratingUnitList(): void {
    const payload = {
      // orgId: "1",
      // oprId: "1"
    };

    // Make the HTTP POST request
    this.http.get<any>('http://192.168.1.36:8081/api/organdopr/getAllOprs', payload).subscribe(
      response => {
        if (response) {
          // Assuming response.data contains the department list
          this.operating_unit_list = response;
          console.log(this.operating_unit_list)
        } else {
          // Handle failure
          console.error('Error fetching departments:', response.message);
        }
      },
      error => {
        // Handle error
        console.error('API Error:', error);
      }
    );

     this.filtered_operating_list =this.operating_unit_list.filter(item => {
      console.log(item.org_id === this.organizationid,item.org_id ,this.organizationid)
      return item.org_id === parseInt(this.organizationid)
    })

    console.log(this.filtered_operating_list)
  }

  ongetRoleList(): void {
    const payload = {
      orgId: "1",
      oprId: "1"
    };

    // Make the HTTP POST request
    this.http.post<any>('http://192.168.1.36:8081/api/roles/getAllRole', payload).subscribe(
      response => {
        if (response) {
          // Assuming response.data contains the department list
          this.role = response;
          console.log(this.role)
        } else {
          // Handle failure
          console.error('Error fetching departments:', response.message);
        }
      },
      error => {
        // Handle error
        console.error('API Error:', error);
      }
    );
  }


  register(): void {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const registerPayload = {
      name: this.name,
      email: this.email,
      phoneNo: this.phoneNo,
      password: this.password,
      departmentId: '8977304036509213',
      roleId: "9065837334047421",
      orgId: '1',
      oprId: '1',
      createdBy: 'admin'
    };

    console.log('Register Payload:', registerPayload);

    this.http.post('http://192.168.1.36:8081/api/auth/register', registerPayload)
      .subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          alert('Registered successfully! Please login.');
          this.togglePage();  // After register, show login form
        },
        error: (error) => {
          console.error('Registration failed', error);
          alert('Registration failed. Please try again.');
        }
      });
  }
}



