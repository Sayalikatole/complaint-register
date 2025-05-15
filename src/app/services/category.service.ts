import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from '../models/category';
import { ApiResponse } from '../models/complaint';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = 'http://192.168.1.36:8081/api/category';

  constructor(private http: HttpClient) { }

  /**
   * Get categories by department
   * @param payload Department data with org_id, opr_id, and department_id
   * @returns Observable with array of categories
   */
  getCategoriesByDepartment(payload: GetCategoryByDepartmentPayload): Observable<Category[]> {
    return this.http.post<Category[]>(`${this.baseUrl}/getCategoryByDepartment`, payload);
  }

  /**
   * Create a new category
   * @param category The category to create
   * @returns Observable with API response
   */
  createCategory(category: Category): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/createCategory`, category);
  }

  /**
   * Update an existing category
   * @param category The category to update
   * @returns Observable with API response
   */
  updateCategory(category: Category): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/updateCategory`, category);
  }
}

export interface GetCategoryByDepartmentPayload {
  org_id: number;
  opr_id: number;
  id: string; // department_id
}