import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['expectedRole'];
  const currentRole = authService.getUserRole();

  if (currentRole === expectedRole) {
    return true;
  } else {
    router.navigate(['/unauthorized']);
    return false;
  }
};
