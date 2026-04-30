import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    private destroy$ = new Subject<void>();

    constructor(private authService: AuthService) {}

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