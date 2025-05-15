import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/complaint';
import { Tags } from '../models/tags';

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private baseUrl = 'http://192.168.1.36:8081/api/tags';

  constructor(private http: HttpClient) { }

  /**
   * Get tags by category
   * @param payload Category data with org_id, opr_id, and category_id
   * @returns Observable with array of tags
   */
  getTagsByCategory(payload: GetTagsByCategoryPayload): Observable<Tags[]> {
    return this.http.post<Tags[]>(`${this.baseUrl}/getTagsByCategory`, payload);
  }

  /**
   * Create a new tag
   * @param tag The tag to create
   * @returns Observable with API response
   */
  createTag(tag: Tags): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/createTag`, tag);
  }

  /**
   * Update an existing tag
   * @param tag The tag to update
   * @returns Observable with API response
   */
  updateTag(tag: Tags): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/updateTag`, tag);
  }
}

export interface GetTagsByCategoryPayload {
  org_id: number;
  opr_id: number;
  id: string; // category_id
}
