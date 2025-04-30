import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (
  route,
  state
): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Refresh session timer on navigation
    authService.startSessionTimer();
    return true;
  } else {
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
};