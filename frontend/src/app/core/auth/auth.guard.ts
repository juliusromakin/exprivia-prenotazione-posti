// core/auth/auth.guard.ts

import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map, take, switchMap, of } from 'rxjs';
import { AuthService } from './auth.service';

export const AuthGuard = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthenticationState().pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        // CORREZIONE: Cambiato da /accedi a /login
        return of(router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        }));
      }

      return authService.getIdentity().pipe(
        take(1),
        map(user => {
          if (!user) {
            // CORREZIONE: Cambiato da /accedi a /login
            return router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url }
            });
          }

          const authorities = route.data['authorities'] as string[];

          if (!authorities || authorities.length === 0) {
            // Se siamo autenticati nella home o login, andiamo alla dashboard di prenotazione
            if (state.url === '/login' || state.url === '/') {
              return router.createUrlTree(['/dashboard/prenotazione-posizione']);
            }
            return true;
          }

          if (authService.hasAnyAuthority(authorities)) {
            return true;
          }

          return router.createUrlTree(['/forbidden']);
        })
      );
    })
  );
};