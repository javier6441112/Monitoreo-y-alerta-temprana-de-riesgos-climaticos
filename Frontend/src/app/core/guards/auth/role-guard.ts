import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Role } from '../../models/api-contract.models';

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as Role[] | undefined;
  const user = auth.getUser();

  return user && (!allowedRoles?.length || allowedRoles.includes(user.rol))
    ? true
    : router.createUrlTree(['/dashboard']);
};
