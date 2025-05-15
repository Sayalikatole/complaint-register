import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  private themePreference = new BehaviorSubject<ThemeMode>('system');

  darkMode$ = this.darkMode.asObservable();
  themePreference$ = this.themePreference.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.setupSystemPreferenceListener();
    }
  }

  /**
   * Initialize theme based on stored preference or system settings
   */
  initializeTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Default to light theme in SSR
      this.disableDarkMode();
      return;
    }

    try {
      const savedTheme = localStorage.getItem('theme') as ThemeMode | null;

      if (savedTheme) {
        this.themePreference.next(savedTheme);

        if (savedTheme === 'dark') {
          this.enableDarkMode();
        } else if (savedTheme === 'light') {
          this.disableDarkMode();
        } else if (savedTheme === 'system') {
          this.applySystemPreference();
        }
      } else {
        // Default to system preference if no saved theme
        this.themePreference.next('system');
        this.applySystemPreference();
      }
    } catch (error) {
      // Handle potential localStorage errors (e.g., disabled cookies, private browsing)
      console.warn('Theme service: Unable to access localStorage', error);
      this.themePreference.next('system');
      this.applySystemPreference();
    }
  }

  /**
   * Setup listener for system preference changes
   */
  setupSystemPreferenceListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Use addEventListener for modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', e => {
          if (this.themePreference.value === 'system') {
            if (e.matches) {
              this.enableDarkMode();
            } else {
              this.disableDarkMode();
            }
          }
        });
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(e => {
          if (this.themePreference.value === 'system') {
            if (e.matches) {
              this.enableDarkMode();
            } else {
              this.disableDarkMode();
            }
          }
        });
      }
    } catch (error) {
      console.warn('Theme service: Error setting up media query listener', error);
    }
  }

  /**
   * Apply system preference (dark or light)
   */
  applySystemPreference(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Default to light theme in SSR
      this.disableDarkMode();
      return;
    }

    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.enableDarkMode();
      } else {
        this.disableDarkMode();
      }
    } catch (error) {
      console.warn('Theme service: Error detecting system preference', error);
      this.disableDarkMode(); // Default to light mode
    }
  }

  /**
   * Toggle between light and dark mode
   */
  toggleDarkMode(): void {
    if (this.darkMode.value) {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  /**
   * Set the theme explicitly
   */
  setTheme(theme: ThemeMode): void {
    this.themePreference.next(theme);

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.warn('Theme service: Unable to save theme preference', error);
      }
    }

    if (theme === 'dark') {
      this.enableDarkMode();
    } else if (theme === 'light') {
      this.disableDarkMode();
    } else if (theme === 'system') {
      this.applySystemPreference();
    }
  }

  /**
   * Enable dark mode
   */
  private enableDarkMode(): void {
    this.document.documentElement.classList.add('dark');
    this.document.documentElement.setAttribute('data-theme', 'dark');
    this.darkMode.next(true);
  }

  /**
   * Disable dark mode
   */
  private disableDarkMode(): void {
    this.document.documentElement.classList.remove('dark');
    this.document.documentElement.setAttribute('data-theme', 'light');
    this.darkMode.next(false);
  }

  /**
   * Get current dark mode state
   */
  isDarkMode(): boolean {
    return this.darkMode.value;
  }

  /**
   * Get current theme preference
   */
  getThemePreference(): ThemeMode {
    return this.themePreference.value;
  }
}