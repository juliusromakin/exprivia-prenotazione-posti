import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { FeatureCardComponent, FeatureCardConfig } from '../../shared/components/feature-card/feature-card.component';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import { AuthService } from '../../core/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-admin-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        HeaderComponent,
        FeatureCardComponent,
        ButtonComponent
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

    constructor(private authService: AuthService) { }

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
            title: 'Gestione Prenotazioni',
            description: 'Visualizza, modifica e gestisci tutte le prenotazioni degli utenti in modo centralizzato.',
            icon: 'event_note',
            features: [
                'Vista completa prenotazioni',
                'Approvazioni e cancellazioni'
            ],
            linkUrl: '/dashboard'
        },
        {
            title: 'Gestione Planimetrie',
            description: 'Configura e aggiorna in modo intuitivo le planimetrie degli uffici, gestendo al meglio postazioni e sale riunioni.',
            icon: 'map',
            features: [
                'Editor planimetria interattivo',
                'Gestione postazioni'
            ],
            linkUrl: '/dashboard'
        }
    ];
}
