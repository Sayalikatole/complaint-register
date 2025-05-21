// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, catchError, of, map } from 'rxjs'; // Added map here

// export interface PatternRecognitionResponse {
//   text: string;
// }

// export interface RecognizedPattern {
//   id: number;
//   text: string;
//   severity: 'critical' | 'warning' | 'info';
//   category: 'trend' | 'volume' | 'performance' | 'repetition';
//   icon: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class PatternrecognisationService {
//   private baseUrl = 'http://192.168.1.36:8081'; // Use your actual API base URL

//   constructor(private http: HttpClient) { }

//   /**
//    * Get pattern recognition insights from the API
//    */
//   getPatternInsights(): Observable<RecognizedPattern[]> {
//     return this.http.get<PatternRecognitionResponse>(`${this.baseUrl}/patternrecognization`)
//       .pipe(
//         catchError(this.handleError<PatternRecognitionResponse>('getPatternInsights')),
//         // Transform the raw text response into structured patterns
//         map(response => this.parsePatternText(response?.text || ''))
//       );
//   }

//   /**
//    * Parse the raw text response into structured pattern objects
//    */
//   private parsePatternText(text: string): RecognizedPattern[] {
//     if (!text) return [];

//     // Split by newline to get individual patterns
//     const patterns = text.split('\n')
//       .filter(line => line.trim().length > 0)
//       .map(line => {
//         // Extract pattern number and text
//         const match = line.match(/^(\d+)\s*-\s*([???\?]+)\s*(.+)$/);
//         if (!match) return null;

//         const id = parseInt(match[1], 10);
//         const severityIndicator = match[2].trim();
//         const patternText = match[3].trim();

//         // Determine severity based on the indicator
//         let severity: 'critical' | 'warning' | 'info';
//         let icon: string;
//         let category: 'trend' | 'volume' | 'performance' | 'repetition';

//         // Determine severity and icon based on the indicator
//         if (severityIndicator.includes('??')) {
//           severity = 'critical';
//           icon = 'exclamation-triangle';
//         } else if (severityIndicator.includes('?')) {
//           severity = 'warning';
//           icon = 'exclamation-circle';
//         } else {
//           severity = 'info';
//           icon = 'info-circle';
//         }

//         // Try to categorize the pattern based on text content
//         if (patternText.includes('increased by') || patternText.includes('decreased by') ||
//           patternText.includes('spike') || patternText.includes('trend')) {
//           category = 'trend';
//           if (!icon) icon = 'chart-line';
//         } else if (patternText.includes('Multiple complaints') || patternText.includes('complaints (n=')) {
//           category = 'volume';
//           if (!icon) icon = 'chart-bar';
//         } else if (patternText.includes('resolution time') || patternText.includes('average')) {
//           category = 'performance';
//           if (!icon) icon = 'tachometer-alt';
//         } else {
//           category = 'repetition';
//           if (!icon) icon = 'sync';
//         }

//         return {
//           id,
//           text: patternText,
//           severity,
//           category,
//           icon
//         };
//       })
//       .filter((pattern): pattern is RecognizedPattern => pattern !== null);

//     return patterns;
//   }

//   /**
//    * Error handling
//    */
//   private handleError<T>(operation = 'operation', result?: T) {
//     return (error: any): Observable<T> => {
//       console.error(`${operation} failed:`, error);
//       // Return empty result so the app keeps running
//       return of(result as T);
//     };
//   }
// }















import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface PatternRecognitionResponse {
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatternrecognisationService {
  private baseUrl = 'http://192.168.1.36:8081'; // Use your actual API base URL

  constructor(private http: HttpClient) { }

  /**
   * Get pattern recognition insights from the API
   */
  getPatternInsights(): Observable<PatternRecognitionResponse> {
    return this.http.get<PatternRecognitionResponse>(`${this.baseUrl}/patternrecognization`)
      .pipe(
        catchError(this.handleError<PatternRecognitionResponse>('getPatternInsights', { text: '' }))
      );
  }

  /**
   * Error handling
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Return empty result so the app keeps running
      return of(result as T);
    };
  }
}