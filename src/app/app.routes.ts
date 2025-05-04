// import { Routes } from '@angular/router';

// export const routes: Routes = [{
//     path:'login',
// }];

// import { Routes } from '@angular/router';

// export const routes: Routes = [{
//     path:'login',
// }];

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './component/login-page/login-page.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { ComplaintRegistrationComponent } from './component/complaint-registration/complaint-registration.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { authGuard } from './gaurds/auth.guard';
import { roleGuard } from './gaurds/role.guard';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component'; // Correct import
import { DepartmentComponent } from './pages/admin/department/department.component';
import { CreateComplaintComponent } from './pages/user/create-complaint/create-complaint.component';
import { ListComplaintComponent } from './pages/user/list-complaint/list-complaint.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { HodComponent } from './pages/hod/hod.component';
import { EmployeeLayoutComponent } from './layouts/employee-layout/employee-layout.component';
import { HodLayoutComponent } from './layouts/hod-layout/hod-layout.component';
import { UserComponent } from './pages/user/user.component';
import { UserDashboardComponent } from './pages/user/user-dashboard/user-dashboard.component';


// export const routes: Routes = [
//   { path: '', redirectTo: 'login', pathMatch: 'full' },
//   { path: 'login', component: LoginPageComponent },
//   {path:'sidebar',component:SidebarComponent},
//   {path:'complaint-registration',component:ComplaintRegistrationComponent}

// ];




export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    data: { expectedRole: '1406827783519433' },
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'department', component: DepartmentComponent },
      { path: 'complaints', component: ListComplaintComponent },
      { path: 'complaints/:id', loadComponent: () => import('./pages/user/detail-complaint/detail-complaint.component').then(c => c.DetailComplaintComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Default to dashboard
    ]
  },
  {
    path: 'client',
    component: UserLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: '9816063224382954' },
    children: [
      { path: 'create-complaints', component: CreateComplaintComponent },
      { path: 'complaints', component: ListComplaintComponent },
      { path: 'complaints/:id', loadComponent: () => import('./pages/user/detail-complaint/detail-complaint.component').then(c => c.DetailComplaintComponent) },

      { path: 'user', component: UserComponent },
      // {path:'user-dashboard',component:UserDashboardComponent}

      // { path: 'suggestions', component: SuggestionsComponent },
      // { path: 'analytics', component: AnalyticsComponent },
    ]
  },
  {
    path: 'employee',
    component: EmployeeLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: '8513155895269752' },
    children: [
      // { path: 'create-complaints', component: CreateComplaintComponent },
      { path: 'complaints', component: ListComplaintComponent },
      { path: 'complaints/:id', loadComponent: () => import('./pages/user/detail-complaint/detail-complaint.component').then(c => c.DetailComplaintComponent) },
      { path: 'create-complaints', component: CreateComplaintComponent },

      // { path: 'suggestions', component: SuggestionsComponent },
      // { path: 'analytics', component: AnalyticsComponent },
    ]
  },
  {
    path: 'hod',
    component: HodLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: '9381190731754782' },
    children: [
      { path: 'create-complaints', component: CreateComplaintComponent },
      { path: 'complaints', component: ListComplaintComponent },
      { path: 'complaints/:id', loadComponent: () => import('./pages/user/detail-complaint/detail-complaint.component').then(c => c.DetailComplaintComponent) },
      { path: 'user', component: UserComponent }

      // { path: 'suggestions', component: SuggestionsComponent },
      // { path: 'analytics', component: AnalyticsComponent },
    ]
  },
  { path: 'login', component: LoginPageComponent },
  { path: '**', redirectTo: 'login' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


