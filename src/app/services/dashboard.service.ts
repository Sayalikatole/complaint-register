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
  org_id: string;
  opr_id: string;
}

export interface DepartmentWiseComplaint {
  total: number;
  department_id: string;
  status_counts: any;
  department_name: string;
  departmentName: string;
  totalComplaints: number;
  open: number;
  in_progress: number;
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
  avgResolutionTime: number;
  avgRating: number;        // Average resolution time
  statusSummary: statusSummary[];    // Array of status summary objects
  org_id: string;                     // Organization ID
  opr_id: string;                     // Operating unit ID
}

export interface ComplaintStatusTrend {
  date: string; // e.g., '2025-05-01'
  pending: number;
  resolved: number;
  inProgress: number;
}

export interface ComplaintPriorityTrend {
  count: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
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
export interface ComplaintDueDatetrend {
  complaintId: string;
  subject: string;
  dueDate: string;         // Keep as string if you're not converting to Date object
  departmentId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH'; // Use union type if priority is fixed
}

export interface ComplaintSummaryTag {
  tag_name: string;
  count: number;
  tag_id: string;
}

export interface ComplaintSummaryCategory {
  category_name: string;
  category_id: string;
  count: number;
  tags: ComplaintSummaryTag[];
}

export interface TeamLoad {
  account_id: string;
  fullName: string;
  loadPercentage: number;
  currentLoad: number;
  animatedLoad?: number;
}



export interface DeptmentList {
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

  // get user created complint summery 
  getClientTotalCompltStats(payload: Cl_getClientDashboardPayload): Observable<ClientComplaintStatsResponse> {
    return this.http.post<ClientComplaintStatsResponse>(
      `${this.baseUrl}/Dashboard/user/complaint-status-summary`,
      payload
    );
  }

  getUsertAssignCompltStats(payload: Cl_getUserDashboardPayload): Observable<ClientComplaintStatsResponse> {
    return this.http.post<ClientComplaintStatsResponse>(
      `${this.baseUrl}/Dashboard/user/assign/complaint-status-summary`,
      payload
    );
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
   * priority for complaints by users
   */
  getHodPriorityComplaintStatus(getDashboardPayload: Cl_getDashboardPayload): Observable<ComplaintPriorityTrend[]> {
    return this.http.post<ComplaintPriorityTrend[]>(`${this.baseUrl}/Dashboard/admin/by-priority`, getDashboardPayload);  
  }

  getAssignedUserPriorityStatus(getUserPayload: Cl_getUserDashboardPayload): Observable<ComplaintPriorityTrend[]> {
    return this.http.post<ComplaintPriorityTrend[]>(`${this.baseUrl}/Dashboard/user/assign/by-priority`, getUserPayload);  
  }

  getCreatedUserPriorityStatus(getUserPayload: Cl_getUserDashboardPayload): Observable<ComplaintPriorityTrend[]> {
    return this.http.post<ComplaintPriorityTrend[]>(`${this.baseUrl}/Dashboard/user/by-priority`, getUserPayload);  
  }


  getDueDateComplaintStatus(getDashboardPayload: Cl_getDashboardPayload): Observable<ComplaintDueDatetrend[]> {
    return this.http.post<ComplaintDueDatetrend[]>(`${this.baseUrl}/Dashboard/admin/pending-complaints-nearing-due`, getDashboardPayload);
  }


  /**
   * Get complaint count by Month (type)
   */
  getMonthlyComplaintCategoryStats(getDashboardPayload: Cl_getDashboardPayload): Observable<ComplaintCategoryStats[]> {
    return this.http.post<ComplaintCategoryStats[]>(`${this.baseUrl}/Dashboard/admin/by-months`, getDashboardPayload);
  }

  getMonthlyUserComplaintCategoryStats(getDashboardPayload: Cl_getDashboardPayload): Observable<ComplaintCategoryStats[]> {
    return this.http.post<ComplaintCategoryStats[]>(`${this.baseUrl}/Dashboard/user/by-months`, getDashboardPayload);
  }

////GET USER CATEGORY AND TAGS

getComplaintSummaryByCategoryAndTags(payload: Cl_getDashboardHodPayload): Observable<ComplaintSummaryCategory[]> {
  return this.http.post<ComplaintSummaryCategory[]>(`${this.baseUrl}/Dashboard/hod/getComplaintSummaryByCategoryAndTags`, payload);
}


getHodTeamLoadData(payload: Cl_getDashboardHodPayload): Observable<TeamLoad[]> {
  return this.http.post<TeamLoad[]>(`${this.baseUrl}/Dashboard/hod/team-load`, payload);
}

}
export interface Cl_getDashboardHodPayload {
  opr_id: string,
  org_id: string,
  id?: string
};

export interface Cl_getDashboardPayload {
  opr_id: string,
  org_id: string,
  id?: string
};

// payload.ts
export interface Cl_getClientDashboardPayload {
  opr_id: string;
  org_id: string;
  id?: string;
}
// payload for user
export interface Cl_getUserDashboardPayload {
  opr_id: string;
  org_id: string;
  id?: string;
}

export interface cl_getHodTeamLoad{
  opr_id: string;
  org_id: string;
  id?: string;
}
// response.ts
export interface ClientComplaintStatsResponse {
  avgResolutionTime: string;
  avgRating: string;
  totalComplaints: number;
  statusSummary: never[];
  totalComplaintCount: number;
  avgResolutionTimeInHours: number | null;
  statusWiseCount: { [status: string]: number }; // e.g., { "OPEN": 2, "CLOSED": 1 }
}

export interface Cl_getDashboardMonthPayload {
  opr_id: string,
  org_id: string
};


export interface Cl_getdashboardataPayload {
  avgRating: any;
  // export interface Cl_getdashboardataPayload {
  statusSummary: Cl_getstatusSummary[];
  avgResolutionTime: number;
  totalComplaints: number;
}

export interface Cl_getstatusSummary {
  count: number;
  status: string;
}