import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CreateSuggestionPayload, Suggestion, SuggestionResponse } from '../models/suggestion';

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  private baseUrl = 'http://192.168.1.36:8081/api/suggestion';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get all suggestions for current user
   */
  getUserSuggestions(getUserSuggestionPayload: Cl_getSuggestionPayload): Observable<Suggestion[]> {
    return this.http.post<Suggestion[]>(`${this.baseUrl}/getAllSuggestion`, getUserSuggestionPayload);
  }

  /**
   * Get a specific suggestion by ID
   */
  getSuggestionById(getSuggestionById: Cl_getSuggestionPayload): Observable<Suggestion> {
    return this.http.post<Suggestion>(`${this.baseUrl}/getSuggestionById`, getSuggestionById);
  }

  /**
   * Create new suggestion with attachment
   * This matches the pattern in ComplaintService.createComplaintWithAttachments
   */
  createSuggestionWithAttachment(payload: Cl_createSuggestionwithAttachmentPayload): Observable<SuggestionResponse> {
    return this.http.post<SuggestionResponse>(`${this.baseUrl}/saveSuggestion`, payload);
  }

  /**
   * Update existing suggestion with attachment
   * This matches the pattern in ComplaintService.updateComplaint
   */
  updateSuggestionWithAttachment(payload: Cl_createSuggestionwithAttachmentPayload): Observable<SuggestionResponse> {
    return this.http.post<SuggestionResponse>(`${this.baseUrl}/updateSuggestion`, payload);
  }

  /**
   * Update existing suggestion without attachment
   * This is a simplified version that may be used in other contexts
   */
  updateSuggestion(suggestionData: CreateSuggestionPayload): Observable<SuggestionResponse> {
    const payload = {
      suggestion: suggestionData,
      attachments: []
    };
    return this.http.post<SuggestionResponse>(`${this.baseUrl}/updateSuggestion`, payload);
  }

  /**
   * Delete suggestion (admin only)
   */
  deleteSuggestion(id: string): Observable<boolean> {
    return this.http.delete<SuggestionResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => {
        return response.status;
      })
    );
  }

  /**
   * Get attachment
   */
  getAttachment(attachmentPayload: Cl_getAttachmentPayload): Observable<SuggestionResponse> {
    return this.http.post<SuggestionResponse>(`http://192.168.1.36:8081/api/attachments/getAttachments`, attachmentPayload);
  }
}

export interface Cl_getSuggestionPayload {
  org_id: string;
  opr_id: string;
  id?: string;
}

export interface Cl_createAttachmentPayload {
  entity_type: string;
  entity_id: string;
  uploaded_file_name: string;
  uploaded_by: string;
  l_encrypted_file: string;
}

export interface Cl_createSuggestionwithAttachmentPayload {
  suggestion: Suggestion;
  attachments: Cl_createAttachmentPayload[];
}

export interface Cl_getAttachmentPayload {
  id: string;
  entity_type: string;
}