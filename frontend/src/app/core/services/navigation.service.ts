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
  badges?: string[];
  children?: NavItem[];
}

@Injectable({
  providedIn: "root",
})
export class NavigationService {

  private readonly navigationItems: NavItem[] = [
    {
      label: "SIDEBAR.DASHBOARD",
      icon: "home",
      route: "/dashboard",
      badges: [UserRole.ADMIN],
    },
    {
      label: "SIDEBAR.USERS",
      icon: "users",
      route: "/dashboard/user-management",
      adminOnly: true,
      badges: [UserRole.ADMIN],
    },
    {
      label: "SIDEBAR.BOOKINGS",
      icon: "calendar",
      route: "/dashboard/bookings",
      // CORREZIONE LOGICA: Anche gli utenti devono poter vedere le loro prenotazioni!
      badges: [UserRole.ADMIN, UserRole.USER],
    },
    {
      label: "SIDEBAR.BOOK_WORKSPACE",
      icon: "layout-dashboard",
      route: "/dashboard/workspace-booking",
      badges: [UserRole.USER, UserRole.ADMIN],
    },
    {
      label: "SIDEBAR.STATISTICS",
      icon: "ChartBar",
      route: "/dashboard/statistics",
      adminOnly: true,
      badges: [UserRole.ADMIN],
    },
    {
      label: "Gestione Planimetrie",
      icon: "map",
      route: "/amministrazione-planimetrie",
      adminOnly: true,
      badges: [UserRole.ADMIN],
    },
    {
      label: "Update Profile",
      icon: "user",
      route: "/dashboard/update-user",
      badges: [UserRole.USER, UserRole.ADMIN],
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
      "/dashboard/workspace-booking": () => currentRoute === "/dashboard/workspace-booking",
      "/dashboard/statistics": () => currentRoute === "/dashboard/statistics",
      "/dashboard/management": () => currentRoute.startsWith("/dashboard/management"),
    };

    return routeMap[checkRoute]
      ? routeMap[checkRoute](currentRoute)
      : currentRoute === checkRoute || currentRoute.startsWith(checkRoute);
  }

  filterNavigationBybadges(userbadges: string[]): NavItem[] {
    return this.navigationItems
      .map((item) => this.filterNavItem(item, userbadges))
      .filter((item) => item !== null) as NavItem[];
  }

  private filterNavItem(
    item: NavItem,
    userbadges: string[]
  ): NavItem | null {
    const hasbadge =
      !item.badges ||
      item.badges.some((auth) => userbadges.includes(auth));

    if (!hasbadge) {
      return null;
    }

    const filteredItem: NavItem = { ...item };

    if (filteredItem.children) {
      filteredItem.children = filteredItem.children
        .map((child) => this.filterNavItem(child, userbadges))
        .filter((child) => child !== null) as NavItem[];

      if (filteredItem.children.length === 0) {
        return null;
      }
    }

    return filteredItem;
  }

  updateNavigationItems(userbadges: string[]): void {
    const filteredItems = this.filterNavigationBybadges(userbadges);
    this.navigationSubject.next(filteredItems);
  }

  resetNavigationItems(): void {
    this.navigationSubject.next([]);
  }
}