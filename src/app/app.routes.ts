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
    // canActivate: [roleGuard],
    data: { expectedRole: 'admin' },
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // { path: 'department-management', component: DepartmentManagementComponent },
      // { path: 'tickets', component: TicketsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Default to dashboard
    ]
  },
  {
    path: 'user',
    component: UserLayoutComponent,
    // canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'user' },
    children: [
      // { path: 'complaints', component: ComplaintsComponent },
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

