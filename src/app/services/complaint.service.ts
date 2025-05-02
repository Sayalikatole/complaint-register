import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Complaint, ApiResponse, ComplaintFilters, CreateComplaintPayload, UpdateComplaintStatusPayload, ComplaintResponse } from '../models/complaint';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  createComplaintWithAttachment(formData: FormData): any {
    throw new Error('Method not implemented.');
  }
  private baseUrl = 'http://192.168.1.36:8081/api/complaint';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }




  /**
   * Get all complaints for current user
   */


  getUserComplaints(getuserComplaintPayload: Cl_getUserComplaintPayload): Observable<Complaint[]> {
    return this.http.post<Complaint[]>(`${this.baseUrl}/getAllComplaint`, getuserComplaintPayload);
  }


  // getUserComplaints(): Observable<Complaint[]> {
  //   const currentUser = this.authService.getCurrentUser();
  //   if (!currentUser) {
  //     return of([]);
  //   }

  //   const url = `${this.baseUrl}/getAllComplaint/${currentUser.userId}`;
  //   return this.http.get<ApiResponse<Complaint[]>>(url).pipe(
  //     map(response => {
  //       if (response.status) {
  //         return response.data;
  //       } else {
  //         throw new Error(response.statusMsg);
  //       }
  //     }),
  //     catchError(error => {
  //       console.error('Error fetching user complaints:', error);
  //       return of(this.getMockComplaints()); // Return mock data in case of error for development
  //     })
  //   );
  // }

  /**
   * Get all complaints (admin)
   */
  getAllComplaints(filters?: ComplaintFilters): Observable<Complaint[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority.toString());
      if (filters.department_id) params = params.set('department_id', filters.department_id);
      if (filters.category_id) params = params.set('category_id', filters.category_id);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    }

    return this.http.get<ApiResponse<Complaint[]>>(this.baseUrl, { params }).pipe(
      map(response => {
        if (response.status) {
          return response.data;
        } else {
          throw new Error(response.statusMsg);
        }
      }),
      catchError(error => {
        console.error('Error fetching all complaints:', error);
        return of(this.getMockComplaints()); // Return mock data in case of error for development
      })
    );
  }


  /**
   * Get a specific complaint by ID
   * @param complaintId The ID of the complaint to retrieve
   * @param userData Optional user data for authorization purposes
   * @returns Observable of the complaint details
   */
  getComplaintById(getuserComplaintbyId: Cl_getComplaintByIdPayload): Observable<Complaint> {
    // Choose the appropriate API call based on your backend:

    // Option 1: Using GET with params
    // const params = new HttpParams()
    //   .set('complaintId', complaintId);

    // if (userData) {
    //   params
    //     .set('oprId', userData.oprId)
    //     .set('orgId', userData.orgId)
    //     .set('userId', userData.userId);
    // }

    // return this.http.get<Complaint>(`${this.apiUrl}/complaint/details`, { params });

    // Option 2: Using POST with body


    return this.http.post<Complaint>(`${this.baseUrl}/getComplaintById`, getuserComplaintbyId);
  }

  /**
   * Create new complaint
   */
  createComplaint(complaintData: CreateComplaintPayload): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`${this.baseUrl}/saveComplaint`, complaintData);
  }


  // createComplaint(complaintData: CreateComplaintPayload): Observable<Complaint> {
  //   return this.http.post<ApiResponse<Complaint>>(this.baseUrl, complaintData).pipe(
  //     map(response => {
  //       if (response.status) {
  //         return response.data;
  //       } else {
  //         throw new Error(response.statusMsg);
  //       }
  //     })
  //   );
  // }

  /**
   * Update existing complaint
   */
  updateComplaint(complaintData: any): Observable<ComplaintResponse> {
    return this.http.put<ComplaintResponse>(`${this.baseUrl}/updateComplaint`, complaintData);
  }

  /**
   * Create complaint with attachment
   */
  // createComplaintWithAttachment(formData: FormData): Observable<ComplaintResponse> {
  //   return this.http.post<ComplaintResponse>(`${this.baseUrl}/saveComplaintWithAttachment`, formData);
  // }

  /**
   * Assign complaint to user
   */
  assignComplaint(complaintId: string, userId: string): Observable<Complaint> {
    return this.http.patch<ApiResponse<Complaint>>(`${this.baseUrl}/${complaintId}/assign`, { assigned_to: userId }).pipe(
      map(response => {
        if (response.status) {
          return response.data;
        } else {
          throw new Error(response.statusMsg);
        }
      })
    );
  }

  /**
   * Delete complaint (admin only)
   */
  deleteComplaint(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`).pipe(
      map(response => {
        return response.status;
      })
    );
  }

  /**
   * Add comment to complaint
   */
  addComment(complaintId: string, comment: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${complaintId}/comments`, { comment }).pipe(
      map(response => {
        if (response.status) {
          return response.data;
        } else {
          throw new Error(response.statusMsg);
        }
      })
    );
  }

  /**
   * Get complaints stats
   */
  getComplaintStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stats`).pipe(
      map(response => {
        if (response.status) {
          return response.data;
        } else {
          throw new Error(response.statusMsg);
        }
      }),
      catchError(error => {
        console.error('Error fetching complaint stats:', error);
        return of({
          total: 45,
          open: 12,
          inProgress: 18,
          resolved: 15,
          highPriority: 7
        });
      })
    );
  }

  /**
   * Get categories for complaints
   */
  getCategories(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/categories`).pipe(
      map(response => {
        if (response.status) {
          return response.data;
        } else {
          throw new Error(response.statusMsg);
        }
      }),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([
          { id: '1', name: 'Hardware' },
          { id: '2', name: 'Software' },
          { id: '3', name: 'Network' },
          { id: '4', name: 'Facilities' }
        ]);
      })
    );
  }

  /**
   * Get mock complaints for development
   */
  private getMockComplaints(): Complaint[] {
    return [
      // {
      //   complaint_id: "C001",
      //   subject: "PC not working properly",
      //   description: "My computer is running very slow and freezing frequently when I try to run multiple applications.",
      //   status: "open",
      //   priority: 'HIGH',
      //   category_id: "1",
      //   category_name: "Hardware",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "JohnDoe",
      //   created_date: "2023-04-20T10:15:00Z"
      // },
      // {
      //   complaint_id: "C002",
      //   subject: "Office AC temperature adjustment needed",
      //   description: "The AC in the main office area is set too cold. Several employees have complained about the temperature.",
      //   status: "resolved",
      //   priority: 'HIGH',
      //   category_id: "4",
      //   category_name: "Facilities",
      //   department_id: "FAC001",
      //   department_name: "Facilities Management",
      //   created_by: "JaneDoe",
      //   created_date: "2023-04-19T09:30:00Z",
      //   resolution_comments: "AC temperature has been adjusted to 23°C as per company policy",
      //   resolution_date: "2023-04-19T14:45:00Z"
      // },
      // {
      //   complaint_id: "C003",
      //   subject: "Email server down",
      //   description: "Cannot send or receive emails since 9 AM. Multiple users affected.",
      //   status: "in progress",
      //   priority: 'HIGH',
      //   category_id: "3",
      //   category_name: "Network",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "JohnDoe",
      //   created_date: "2023-04-21T09:00:00Z",
      //   assigned_to: "TechSupport1",
      //   assigned_to_name: "Technical Support Team"
      // },
      // {
      //   complaint_id: "C004",
      //   subject: "Software license expired",
      //   description: "The Adobe Creative Suite license has expired for the design team. Need immediate renewal.",
      //   status: "pending",
      //   priority: 'HIGH',
      //   category_id: "2",
      //   category_name: "Software",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "AliceSmith",
      //   created_date: "2023-04-18T14:20:00Z"
      // },
      // {
      //   complaint_id: "C005",
      //   subject: "Printer not working",
      //   description: "The main office printer is showing error code E502 and won't print documents.",
      //   status: "open",
      //   priority: 'HIGH',
      //   category_id: "1",
      //   category_name: "Hardware",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "BobJohnson",
      //   created_date: "2023-04-21T11:45:00Z"
      // },
      // {
      //   complaint_id: "C006",
      //   subject: "Request for new monitor",
      //   description: "My current monitor flickers and causes eye strain. Requesting a replacement.",
      //   status: "pending",
      //   priority: 'HIGH',
      //   category_id: "1",
      //   category_name: "Hardware",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "JohnDoe",
      //   created_date: "2023-04-17T15:30:00Z"
      // },
      // {
      //   complaint_id: "C007",
      //   subject: "VPN connection issues",
      //   description: "Cannot connect to company VPN when working remotely. Error message says 'Authentication failed'.",
      //   status: "in progress",
      //   priority: 'HIGH',
      //   category_id: "3",
      //   category_name: "Network",
      //   department_id: "IT001",
      //   department_name: "IT Support",
      //   created_by: "SarahConnor",
      //   created_date: "2023-04-20T08:15:00Z",
      //   assigned_to: "NetworkAdmin",
      //   assigned_to_name: "Network Administration"
      // }
    ];
  }
}

export interface Cl_getUserComplaintPayload {
  orgId: string,
  oprId: string,
  id: string,
}

// interface for the getComplaintById payload if needed
export interface Cl_getComplaintByIdPayload {
  orgId: string,
  oprId: string,
  id: string,
}