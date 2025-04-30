import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Get the expected role from route data
  const expectedRole = route.data['expectedRole'];

  // Get the current user
  const currentUser = authService.getCurrentUser();

  // Check if user has the required role
  // You might need to adjust this depending on how roles are stored
  // This assumes role is a string ID that matches the expected role
  if (currentUser && currentUser.role === expectedRole) {
    return true;
  }

  // If role doesn't match, redirect to unauthorized page
  // You should create an unauthorized component
  return router.createUrlTree(['/unauthorized']);
};