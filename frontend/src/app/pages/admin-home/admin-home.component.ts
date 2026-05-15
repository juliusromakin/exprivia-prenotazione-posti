import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { FeatureCardComponent, FeatureCardConfig } from '../../shared/components/feature-card/feature-card.component';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import { AuthService } from '../../core/auth/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-admin-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        HeaderComponent,
        FeatureCardComponent,
        ButtonComponent,
        TranslateModule
    ],
    templateUrl: './admin-home.component.html',
    animations: [
        authAnimations.fadeIn,
        authAnimations.slideUp,
        authAnimations.scaleIn
    ]
})
export class AdminHomeComponent implements OnInit, OnDestroy {
    isAuthenticated = false;
    private destroy$ = new Subject<void>();

    constructor(private authService: AuthService, private translate: TranslateService) { }

    ngOnInit(): void {
        this.authService
            .getAuthenticationState()
            .pipe(takeUntil(this.destroy$))
            .subscribe((isAuthenticated) => {
                this.isAuthenticated = isAuthenticated;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    featureCards: FeatureCardConfig[] = [
        {
            title: 'ADMIN_HOME.CARDS.BOOKINGS_TITLE',
            description: 'ADMIN_HOME.CARDS.BOOKINGS_DESC',
            icon: 'event_note',
            features: [
                'ADMIN_HOME.CARDS.BOOKINGS_FEAT_1',
                'ADMIN_HOME.CARDS.BOOKINGS_FEAT_2'
            ]
        },
        {
            title: 'ADMIN_HOME.CARDS.PLANS_TITLE',
            description: 'ADMIN_HOME.CARDS.PLANS_DESC',
            icon: 'map',
            features: [
                'ADMIN_HOME.CARDS.PLANS_FEAT_1',
                'ADMIN_HOME.CARDS.PLANS_FEAT_2'
            ]
        },
        {
            title: 'ADMIN_HOME.CARDS.BADGE_TITLE',
            description: 'ADMIN_HOME.CARDS.BADGE_DESC',
            icon: 'admin_panel_settings',
            features: [
                'ADMIN_HOME.CARDS.BADGE_FEAT_1',
                'ADMIN_HOME.CARDS.BADGE_FEAT_2'
            ]
        },
        {
            title: 'ADMIN_HOME.CARDS.LOCATION_TITLE',
            description: 'ADMIN_HOME.CARDS.LOCATION_DESC',
            icon: 'corporate_fare',
            features: [
                'ADMIN_HOME.CARDS.LOCATION_FEAT_1',
                'ADMIN_HOME.CARDS.LOCATION_FEAT_2'
            ]
        }
    ];
}
