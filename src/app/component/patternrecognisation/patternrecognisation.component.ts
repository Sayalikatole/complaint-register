import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PatternrecognisationService, RecognizedPattern } from '../../services/patternrecognisation.service';

@Component({
  selector: 'app-patternrecognisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patternrecognisation.component.html',
  styleUrls: ['./patternrecognisation.component.scss']
})
export class PatternrecognisationComponent implements OnInit, OnDestroy {
  patterns: RecognizedPattern[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Filters
  selectedSeverity: string = 'all';
  selectedCategory: string = 'all';

  // Track whether the component is destroyed
  private destroy$ = new Subject<void>();

  constructor(private patternService: PatternrecognisationService) { }

  ngOnInit(): void {
    this.loadPatternInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load pattern insights from service
   */
  loadPatternInsights(): void {
    this.loading = true;
    this.error = null;

    this.patternService.getPatternInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patterns) => {
          this.patterns = patterns;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading pattern insights:', err);
          this.error = 'Failed to load insights. Please try again later.';
          this.loading = false;
        }
      });
  }

  /**
   * Filter patterns by severity
   */
  filterBySeverity(severity: string): void {
    this.selectedSeverity = severity;
  }

  /**
   * Filter patterns by category
   */
  filterByCategory(category: string): void {
    this.selectedCategory = category;
  }

  /**
   * Get filtered patterns based on selected filters
   */
  get filteredPatterns(): RecognizedPattern[] {
    let filtered = this.patterns;

    if (this.selectedSeverity !== 'all') {
      filtered = filtered.filter(p => p.severity === this.selectedSeverity);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    return filtered;
  }

  /**
   * Get color class based on severity
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get icon color class based on severity
   */
  getIconColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  /**
   * Get category display name
   */
  getCategoryName(category: string): string {
    switch (category) {
      case 'trend': return 'Trend Analysis';
      case 'volume': return 'Volume Metrics';
      case 'performance': return 'Performance Metrics';
      case 'repetition': return 'Repeated Patterns';
      default: return 'Other Insights';
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadPatternInsights();
  }

  /**
   * Get pattern count by severity
   */
  getCountBySeverity(severity: string): number {
    return this.patterns.filter(p => p.severity === severity).length;
  }
}