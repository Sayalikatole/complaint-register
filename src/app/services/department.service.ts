import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DepartmentResponse, DepartmentRequest, Department } from '../models/department';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private baseUrl = 'http://192.168.1.36:8081/api/departments';

  constructor(private http: HttpClient) { }
  /**
   * Get all departments for the given organization and operating unit
   * @param org_id Organization ID
   * @param opr_id Operating Unit ID
   * @returns Observable with departments list
   */
  getDepartments(getDepartmentPayload: Cl_getDepartmentPayload): Observable<Department[]> {
    return this.http.post<Department[]>(`${this.baseUrl}/getAllDepartment`, getDepartmentPayload);
  }


  /**
   * Create a new department
   * @param departmentData Department information to create
   * @returns Observable with creation response
   */
  createDepartment(departmentData: Department): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(`${this.baseUrl}/saveDepartment`, departmentData);
  }

  /**
   * Update an existing department
   * @param departmentId Department ID to update
   * @param departmentData Updated department data
   * @returns Observable with update response
   */
  updateDepartment(departmentData: Department): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.baseUrl}/updateDepartment`, departmentData);
  }

  /**
   * Change department status (activate/deactivate)
   * @param departmentId Department ID to update
   * @param isActive New status (YES/NO)
   * @returns Observable with status update response
   */
  changeDepartmentStatus(departmentId: string, isActive: string): Observable<DepartmentResponse> {
    const data = { isActive, updatedBy: 'admin' };
    return this.http.patch<DepartmentResponse>(`${this.baseUrl}/changeStatus/${departmentId}`, data);
  }
}

export interface Cl_getDepartmentPayload {
  opr_id: string,
  org_id: string
};