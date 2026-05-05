import { Component, OnDestroy, OnInit, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatExpansionModule } from "@angular/material/expansion";
import { LucideAngularModule } from "lucide-angular";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Subject, takeUntil, catchError } from "rxjs";
import { User } from "../../../core/models";
import { AuthService } from "../../../core/auth/auth.service";
import { LoginService } from "../../../login/login.service";
import { NavigationService, NavItem } from "@core/services/navigation.service";
import { SidebarService } from "../../services/sidebar.service";
import { animate, state, style, transition, trigger } from '@angular/animations';

const SIDEBAR_STATE_KEY = 'sidebarCollapsed';

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    LucideAngularModule,
  ],
  animations: [
    trigger('sidebarWidth', [
      state('expanded', style({
        width: '256px'
      })),
      state('collapsed', style({
        width: '72px'
      })),
      transition('expanded <=> collapsed', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Stato dell'utente e dell'autenticazione
  isAdmin = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  isCollapsed = false;

  // Elementi di navigazione
  navItems: NavItem[] = [];

  // Subject per la gestione della pulizia delle sottoscrizioni
  private destroy$ = new Subject<void>();

  // Screen width threshold for automatic collapse (in pixels)
  private readonly COLLAPSE_WIDTH = 768;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.handleResponsiveSidebar();
    this.sidebarService.updateForWindowResize();
  }

  constructor(
    private authService: AuthService,
    private loginService: LoginService,
    private navigationService: NavigationService,
    private sidebarService: SidebarService
  ) {
    // Sync with sidebar service
    this.isCollapsed = this.sidebarService.isCollapsed;
  }

  // Toggle sidebar collapse
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  // Metodo per convertire i ruoli in nomi visualizzabili
  getRoleDisplayName(badges: string[] | undefined): string {
    if (!badges?.length) {
      return "Ruolo sconosciuto";
    }

    const roleMap: { [key: string]: string } = {
      ROLE_ADMIN: "Amministratore",
      ROLE_USER: "Dipendente",
    };

    const primaryRole = badges.find((role) => role in roleMap);
    return roleMap[primaryRole || ""] || "Ruolo sconosciuto";
  }

  ngOnInit(): void {
    // Check initial window width and collapse if needed
    this.handleResponsiveSidebar();

    // Subscribe to sidebar state changes
    this.sidebarService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isCollapsed => {
        this.isCollapsed = isCollapsed;
      });

    // Sottoscrizione allo stato di autenticazione
    this.authService
      .getAuthenticationState()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.resetAuthState();
          return [];
        })
      )
      .subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.loadUserIdentity();
        } else {
          this.resetAuthState();
        }
      });

    // Sottoscrizione agli elementi di navigazione
    this.navigationService
      .getNavigationItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => (this.navItems = items));
  }

  // Carica l'identità dell'utente
  private loadUserIdentity(): void {
    this.authService
      .getIdentity()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.resetAuthState();
          return [];
        })
      )
      .subscribe((user) => {
        this.currentUser = user;
        this.isAdmin = user?.badges?.includes("ROLE_ADMIN") || false;

        // Aggiorna gli elementi di navigazione in base alle autorizzazioni
        if (user?.badges) {
          this.navigationService.updateNavigationItems(user.badges);
        }
      });
  }

  // Reset dello stato di autenticazione
  private resetAuthState(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.isAdmin = false;
    this.navigationService.updateNavigationItems([]);
  }

  // Gestione del logout
  logout(): void {
    this.loginService.logout();
  }

  // Verifica se una route è attiva
  isRouteActive(route: string): boolean {
    return this.navigationService.isRouteActive(route);
  }

  // Verifica se un elemento di navigazione deve essere visualizzato
  isNavItemVisible(item: NavItem): boolean {
    if (!this.currentUser?.badges) {
      return false;
    }

    if (item.adminOnly && !this.isAdmin) {
      return false;
    }

    return (
      !item.badges ||
      item.badges.some((auth) =>
        this.currentUser?.badges?.includes(auth)
      )
    );
  }

  // Collapse sidebar on small screens
  private handleResponsiveSidebar(): void {
    if (window.innerWidth < this.COLLAPSE_WIDTH && !this.isCollapsed) {
      this.sidebarService.setCollapsed(true);
    } else if (window.innerWidth >= this.COLLAPSE_WIDTH && this.isCollapsed) {
      this.sidebarService.setCollapsed(false);
    }
  }

  ngOnDestroy(): void {
    // Pulizia delle sottoscrizioni
    this.destroy$.next();
    this.destroy$.complete();
  }
}
