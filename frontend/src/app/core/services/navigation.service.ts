// frontend/src/app/core/services/navigation.service.ts

import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Router } from "@angular/router";
// IMPORTANTE: Usa l'enum per evitare errori di digitazione sui ruoli!
import { UserRole } from "../models";

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  authorities?: string[];
  children?: NavItem[];
}

@Injectable({
  providedIn: "root",
})
export class NavigationService {

  private readonly navigationItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: "home",
      route: "/dashboard",
      authorities: [UserRole.ADMIN],
    },
    {
      label: "Utenti",
      icon: "users",
      route: "/dashboard/user-management",
      adminOnly: true,
      authorities: [UserRole.ADMIN],
    },
    {
      label: "Prenotazioni",
      icon: "calendar",
      route: "/dashboard/bookings",
      // CORREZIONE LOGICA: Anche gli utenti devono poter vedere le loro prenotazioni!
      authorities: [UserRole.ADMIN, UserRole.USER],
    },
    {
      label: "Prenota",
      icon: "layout-dashboard",
      // TODO: Quando tradurrai i nomi dei componenti/pagine della UI, ricordati di cambiare questa rotta (es. /dashboard/book-workspace)
      route: "/dashboard/prenotazione-posizione",
      authorities: [UserRole.USER, UserRole.ADMIN],
    },
    {
      label: "Statistiche",
      icon: "ChartBar",
      // TODO: Anche qui, valuta se tradurre in /dashboard/statistics in futuro
      route: "/dashboard/statistiche",
      adminOnly: true,
      authorities: [UserRole.ADMIN],
    },
    {
      label: "Aggiorna Profilo",
      icon: "user",
      route: "/dashboard/update-user",
      authorities: [UserRole.USER, UserRole.ADMIN],
    },
  ];

  private navigationSubject = new BehaviorSubject<NavItem[]>(
    this.navigationItems
  );

  constructor(private router: Router) { }

  getNavigationItems(): Observable<NavItem[]> {
    return this.navigationSubject.asObservable();
  }

  isRouteActive(route: string): boolean {
    const currentRoute = this.router.url.replace(/\/$/, "");
    const checkRoute = route.replace(/\/$/, "");

    // Aggiornata la mappa delle rotte per includere eventuali percorsi dinamici
    const routeMap: { [key: string]: (route: string) => boolean } = {
      "": () => currentRoute === "" || currentRoute === "/",
      "/dashboard": () => currentRoute === "/dashboard",
      "/dashboard/user-management": () => currentRoute === "/dashboard/user-management",
      "/dashboard/bookings": () => currentRoute === "/dashboard/bookings",
      // Mantenute in italiano per ora per non rompere il routing attuale
      "/dashboard/prenotazione-posizione": () => currentRoute === "/dashboard/prenotazione-posizione",
      "/dashboard/statistiche": () => currentRoute === "/dashboard/statistiche",
      "/dashboard/management": () => currentRoute.startsWith("/dashboard/management"),
    };

    return routeMap[checkRoute]
      ? routeMap[checkRoute](currentRoute)
      : currentRoute === checkRoute || currentRoute.startsWith(checkRoute);
  }

  filterNavigationByAuthorities(userAuthorities: string[]): NavItem[] {
    return this.navigationItems
      .map((item) => this.filterNavItem(item, userAuthorities))
      .filter((item) => item !== null) as NavItem[];
  }

  private filterNavItem(
    item: NavItem,
    userAuthorities: string[]
  ): NavItem | null {
    const hasAuthority =
      !item.authorities ||
      item.authorities.some((auth) => userAuthorities.includes(auth));

    if (!hasAuthority) {
      return null;
    }

    const filteredItem: NavItem = { ...item };

    if (filteredItem.children) {
      filteredItem.children = filteredItem.children
        .map((child) => this.filterNavItem(child, userAuthorities))
        .filter((child) => child !== null) as NavItem[];

      if (filteredItem.children.length === 0) {
        return null;
      }
    }

    return filteredItem;
  }

  updateNavigationItems(userAuthorities: string[]): void {
    const filteredItems = this.filterNavigationByAuthorities(userAuthorities);
    this.navigationSubject.next(filteredItems);
  }

  resetNavigationItems(): void {
    this.navigationSubject.next([]);
  }
}