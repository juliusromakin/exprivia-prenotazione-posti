import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

export const UserRouteAccessService: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const badges = route.data['badges'] as string[];

  // Se non ci sono autorità richieste, permetti l'accesso
  if (!badges || badges.length === 0) {
    return true;
  }

  // Verifica se l'utente è autenticato e ha i permessi necessari
  if (authService.isAuthenticated()) {
    if (authService.hasAnybadge(badges)) {
      return true;
    } else {
      // L'utente è autenticato ma non ha i permessi richiesti
      return router.createUrlTree(['/forbidden']);
    }
  }

  // Utente non autenticato, reindirizza alla home
  return router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
};