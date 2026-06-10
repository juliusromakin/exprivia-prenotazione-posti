import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { FeatureCardComponent, FeatureCardConfig } from '../../shared/components/feature-card/feature-card.component';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import { AuthService } from '../../core/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
        HeaderComponent,
        FeatureCardComponent,
        ButtonComponent,
    ],
    templateUrl: './home.component.html',
    animations: [
        authAnimations.fadeIn,
        authAnimations.slideUp,
        authAnimations.scaleIn
    ]
})
export class HomeComponent implements OnInit, OnDestroy {
    isAuthenticated = false;
    isAdmin = false;
    isUser = false;
    showUnauthorizedWarning = false;
    isScrolledDown = false;
    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService, 
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.authService
            .getAuthenticationState()
            .pipe(takeUntil(this.destroy$))
            .subscribe((isAuthenticated) => {
                this.isAuthenticated = isAuthenticated;
                if (isAuthenticated) {
                    this.loadUserIdentity();
                }
            });

        // Controlla se l'utente è stato reindirizzato qui perché non autorizzato
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['unauthorized']) {
                this.onBookClick();
                // Pulisci l'URL per non mostrare il parametro all'infinito
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { unauthorized: null },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            }
        });
    }

    private loadUserIdentity(): void {
        this.authService.getIdentity().subscribe(user => {
            if (user) {
                this.isAdmin = user.badges?.includes('ROLE_ADMIN') ?? false;
                this.isUser = user.badges?.includes('ROLE_USER') ?? false;
            }
        });
    }

    onBookClick(): void {
        if (this.isAuthenticated) {
            if (this.isAdmin || this.isUser) {
                this.router.navigate(['/dashboard']);
            } else {
                // È un Guest
                this.showUnauthorizedWarning = true;
                // Nascondi l'avviso dopo 5 secondi
                setTimeout(() => this.showUnauthorizedWarning = false, 5000);
            }
        } else {
            this.router.navigate(['/login']);
        }
    }

    scrollToFeatures(): void {
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleScroll(): void {
        if (this.isScrolledDown) {
            this.scrollToTop();
        } else {
            this.scrollToFeatures();
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // Se lo scroll supera i 300px, mostriamo la freccia "torna sopra"
        this.isScrolledDown = window.scrollY > 300;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    featureCards: FeatureCardConfig[] = [
        {
            title: 'HOME.FEATURE_1.TITLE',
            description: 'HOME.FEATURE_1.DESC',
            icon: 'calendar_today',
            features: [
                'HOME.FEATURE_1.BULLET_1',
                'HOME.FEATURE_1.BULLET_2'
            ],
            linkUrl: '/prenotazioni'
        },
        {
            title: 'HOME.FEATURE_2.TITLE',
            description: 'HOME.FEATURE_2.DESC',
            icon: 'schedule',
            features: [
                'HOME.FEATURE_2.BULLET_1',
                'HOME.FEATURE_2.BULLET_2'
            ],
            linkUrl: '/gestione'
        },
        {
            title: 'HOME.FEATURE_3.TITLE',
            description: 'HOME.FEATURE_3.DESC',
            icon: 'group',
            features: [
                'HOME.FEATURE_3.BULLET_1',
                'HOME.FEATURE_3.BULLET_2'
            ],
            linkUrl: '/team'
        }
    ];
}