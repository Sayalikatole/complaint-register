// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';



// @Injectable({
//   providedIn: 'root'
// })
// export class DashboardService {
//   private baseUrl = 'http://192.168.1.36:8081/api/departments';

//   constructor(private http: HttpClient) { }

 
// }
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// You should create these interfaces in a models file for type safety
export interface DashboardService {
  orgId: string;
  oprId: string;
}

export interface DepartmentWiseComplaint {
  total: number;
  department_id: string;
  status_counts: any;
  department_name: string;
  departmentName: string;
  totalComplaints: number;
  open:number;
  in_progress:number;
  resolved: number;
  pending: number;
  // avgResolutionTime: string; // e.g., '2 days'
}


// Interface for the status summary data
interface statusSummary {
  count: number;
  status: string;
}

// Interface for the entire dashboard data
export interface Dashboardata {
  totalComplaints: number;           // Total number of complaints
  openComplaints: number;            // Number of open complaints
  pendingComplaints: number;         // Number of complaints in progress
  resolvedComplaints: number;        // Number of resolved complaints
  closedComplaints: number;          // Number of closed complaints
  avgResolutionTime: number;         // Average resolution time
  statusSummary: statusSummary[];    // Array of status summary objects
  orgId: string;                     // Organization ID
  oprId: string;                     // Operating unit ID
}

export interface ComplaintStatusTrend {
  date: string; // e.g., '2025-05-01'
  pending: number;
  resolved: number;
  inProgress: number;
}

export interface ComplaintCategoryStats {
  assigned_complaints: number;
  closed_complaints: number;
  resolved_complaints: number;
  escalated_complaints: number;
  month: string; // e.g., "05", "06"
  deferred_complaints: number;
  in_progress_complaints: number;
  total_complaints: number;
  open_complaints: number;
  reopened_complaints: number;
}


export interface DeptmentList{
  department_id: string;
    org_id: string;
    department_name: string;
    description: string;
    created_by?: string;
    created_on?: string;
    modified_by?: string;
    modified_on?: string;
    is_active: string;
    opr_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'http://192.168.1.36:8081/api'; // Change to match actual API path

  constructor(private http: HttpClient) { }

   /**
   * Get department-wise complaint summary
   */
   getAdminTotalCompltStats(getDashboardPayload: Cl_getDashboardPayload): Observable<Cl_getdashboardataPayload> {
    return this.http.post<Cl_getdashboardataPayload>(`${this.baseUrl}/Dashboard/admin/complaint-status-summary`, getDashboardPayload);
  }


  getAllDepatList(getDashboardPayload: Cl_getDashboardPayload): Observable<DeptmentList[]> {
   return this.http.post<DeptmentList[]>(`${this.baseUrl}/departments/getAllDepartment`, getDashboardPayload);
 }
  /**
   * Get department-wise complaint summary
   */
  getDashboardComplaintStats(getDashboardPayload: Cl_getDashboardPayload): Observable<DepartmentWiseComplaint[]> {
    return this.http.post<DepartmentWiseComplaint[]>(`${this.baseUrl}/Dashboard/admin/by-department-status`, getDashboardPayload);
  }

  /**
   * Get 7-day trend of complaint status
   */
  // getUserComplaintStatus(getDashboardMonthPayload: Cl_getDashboardMonthPayload): Observable<ComplaintStatusTrend[]> {
  //   return this.http.post<ComplaintStatusTrend[]>(`${this.baseUrl}/status-trend`, getDashboardMonthPayload);
  // }

  /**
   * Get complaint count by Month (type)
   */
  getMonthlyComplaintCategoryStats(getDashboardPayload: Cl_getDashboardPayload): Observable<ComplaintCategoryStats[]> {
    return this.http.post<ComplaintCategoryStats[]>(`${this.baseUrl}/Dashboard/admin/by-months`, getDashboardPayload);
  }
  // getMonthlyComplaintTrend(payload: { orgId: number; oprId: number }) {
  //   return this.http.post<any[]>('http://localhost:8081/api/Dashboard/admin/by-months', payload);
  // }
  
}
export interface Cl_getDashboardPayload {
  oprId: string,
  orgId: string
};

export interface Cl_getDashboardMonthPayload {
  oprId: string,
  orgId: string
};


export interface Cl_getdashboardataPayload{
  statusSummary: Cl_getstatusSummary[];
  avgResolutionTime:number;
  totalComplaints:number;
}

export interface Cl_getstatusSummary{
  count:number;
  status:string;
}