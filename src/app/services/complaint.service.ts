import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Complaint, ApiResponse, ComplaintFilters, CreateComplaintPayload, UpdateComplaintStatusPayload, ComplaintResponse, ComplaintHistoryItem } from '../models/complaint';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
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

  // Update the existing methods or add new ones to handle this payload structure

  /**
   * Create new complaint with attachments
   */
  createComplaintWithAttachments(payload: Cl_createComplaintwithAttachmentPayload): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`${this.baseUrl}/saveComplaint`, payload);
  }

  /**
   * Update existing complaint
   */
  updateComplaint(complaintData: CreateComplaintPayload): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`${this.baseUrl}/updateComplaint`, complaintData);
  }

  /**
   * Create complaint without attachments
   */
  createComplaint(complaintData: CreateComplaintPayload): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`${this.baseUrl}/saveComplaint`, complaintData);
  }

  /**
   * Upload attachment independently
   */
  getAttachment(attachmentPayload: Cl_getAttachmentPayload): Observable<ComplaintResponse> {
    return this.http.post<ComplaintResponse>(`http://192.168.1.36:8081/api/attachments/getAttachments`, attachmentPayload);
  }

  /**
 * Get complaint status history
 */
  getComplaintHistory(payload: Cl_getComplaintHistoryPayload): Observable<ComplaintHistoryItem[]> {
    return this.http.post<ComplaintHistoryItem[]>(`http://192.168.1.36:8081/api/complaintStatusHistory/getHistoryByComplaint`, payload);
  }

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
    return [];
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


export interface Cl_createAttachmentPayload {
  entity_type: string,
  entity_id: string,
  uploaded_file_name: string,
  uploaded_by: string,
  l_encrypted_file: string
}


export interface Cl_createComplaintwithAttachmentPayload {
  attachments: Cl_createAttachmentPayload[],
  complaint: Complaint
}

export interface Cl_getAttachmentPayload {
  id: string,
  entity_type: string,
}

// Add this interface for the payload
export interface Cl_getComplaintHistoryPayload {
  orgId: string;
  oprId: string;
  id: string;
}