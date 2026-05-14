import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule, Location } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { LucideAngularModule } from "lucide-angular";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { LoginService } from "../../login/login.service";
import { User as UserModel } from "../../core/models";
import { NavigationService, NavItem } from "@core/services/navigation.service";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    LucideAngularModule,
    TranslateModule
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: UserModel | null = null;
  isMenuOpen = false;
  navItems: NavItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private loginService: LoginService,
    private navigationService: NavigationService,
    private translate: TranslateService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.authService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.loadUserIdentity();
        } else {
          this.resetAuthState();
        }
      });

    this.authService
      .getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (!user) {
          this.resetAuthState();
        }
      });

    this.navigationService
      .getNavigationItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => (this.navItems = items));
  }

  private loadUserIdentity(): void {
    this.authService
      .getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user?.badges) {
          this.navigationService.updateNavigationItems(user.badges);
        }
      });
  }

  private resetAuthState(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.navigationService.updateNavigationItems([]);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.isMenuOpen = false;
    this.loginService.logout();
  }

  // 3. Cambia la lingua e la salva nel localStorage per persistenza al refresh
  cambiaLingua(lingua: string): void {
    this.translate.use(lingua);
    localStorage.setItem('userLanguage', lingua);
  }

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'it';
  }

  get currentFlag(): string {
    return this.getFlag(this.currentLang);
  }

  get isPlanimetriePage(): boolean {
    return this.router.url.startsWith('/amministrazione-planimetrie');
  }

  tornaIndietro(): void {
    this.location.back();
  }

  get isAdmin(): boolean {
    return this.currentUser?.badges?.includes('ROLE_ADMIN') ?? false;
  }

  getFlag(lang: string): string {
    switch(lang) {
      // Puoi sostituire questi URL con percorsi locali come 'assets/flags/it.png' quando avrai scaricato le immagini
      case 'it': return 'https://flagcdn.com/w40/it.png';
      case 'en': return 'https://flagcdn.com/w40/gb.png';
      default: return 'https://flagcdn.com/w40/it.png';
    }
  }

  isRouteActive(route: string): boolean {
    const currentRoute = window.location.pathname;
    if (route === '/dashboard/update-user') {
      return currentRoute === '/dashboard/update-user';
    }
    return currentRoute === route;
  }

  isNavItemVisible(item: NavItem): boolean {
    if (!this.currentUser?.badges) {
      return false;
    }

    if (item.adminOnly && !this.currentUser.badges.includes('ROLE_ADMIN')) {
      return false;
    }

    return (
      !item.badges ||
      item.badges.some((auth) =>
        this.currentUser?.badges?.includes(auth)
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}