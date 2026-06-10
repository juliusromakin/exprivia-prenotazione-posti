import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { authAnimations } from '../../../shared/animations/auth.animations';

export interface FeatureCardConfig {
    title: string;
    description: string;
    icon: string;
    features?: string[];
    linkText?: string;
    linkUrl?: string;
    iconColor?: string;
    backgroundColor?: string;
    borderColor?: string;
}

@Component({
    selector: 'app-feature-card',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatRippleModule,
        RouterModule,
        TranslateModule,
    ],
    template: `
        <div
            class="group relative h-full flex flex-col items-center text-center p-8 rounded-[var(--radius-2xl)] bg-white border border-gray-200"
        >
            
            <div
                class="absolute inset-0 bg-white/5 backdrop-blur-md rounded-[var(--radius-2xl)] border border-white/10"
                aria-hidden="true"
            ></div>

      

            <!-- Content Container -->
            <div class="relative z-10 w-full">
                <!-- Icon Container -->
                <div
                    class="relative w-14 h-14 rounded-[var(--radius-xl)] mb-6 mx-auto bg-expriviaOrange/20 shadow-[inset_0_0_0_1px_rgba(233,80,14,0.3)] grid place-items-center"
                >
                    <mat-icon
                        class="text-expriviaOrange w-7 h-7 drop-shadow-md"
                        aria-hidden="true"
                    >
                        {{ config.icon }}
                    </mat-icon>
                </div>

                <!-- Text Content -->
                <div>
                    <h3
                        class="text-2xl font-semibold mb-3 text-gray-800"
                    >
                        {{ config.title | translate }}
                    </h3>
                    <p class="text-gray-600 mb-6">{{ config.description | translate }}</p>

                    <!-- Feature List -->
                    <ul *ngIf="config.features?.length" class="text-left space-y-2 mb-6">
                        <li
                            *ngFor="let feature of config.features"
                            class="flex items-center text-gray-700"
                        >
                            <mat-icon class="text-expriviaOrange mr-2 drop-shadow-sm" aria-hidden="true">
                                check_circle
                            </mat-icon>
                            {{ feature | translate }}
                        </li>
                    </ul>

                    <!-- Learn More Link -->
                    <a
                        *ngIf="config.linkText && config.linkUrl"
                        [routerLink]="config.linkUrl"
                        class="inline-flex items-center text-expriviaOrange font-medium"
                       
                    >
                        {{ config.linkText | translate }}
                        <mat-icon
                            class="ml-2"
                            aria-hidden="true"
                        >
                            arrow_forward
                        </mat-icon>
                    </a>
                </div>
            </div>
        </div>
    `
})
export class FeatureCardComponent {
    @Input() config!: FeatureCardConfig;

    getCardClasses(): string {
        return `
            ${this.config.backgroundColor || 'bg-expriviaBlue/90'}
            ${this.config.borderColor || 'border-white/20 hover:border-expriviaOrange/40'}
        `;
    }

    getHoverEffectClasses(): string {
        return 'from-expriviaOrange/10 to-expriviaBlue/5';
    }

   getIconContainerClasses(): string {
    return `bg-expriviaOrange/20 group-hover:bg-expriviaOrange/30 shadow-[inset_0_0_0_1px_rgba(233,80,14,0.3)] group-hover:shadow-[inset_0_0_0_1px_rgba(233,80,14,0.5)] flex items-center justify-center`;
}

  getIconClasses(): string {
    return `text-expriviaOrange w-8 h-8 group-hover:text-expriviaOrange600`;
}
    getTitleClasses(): string {
        return 'text-white group-hover:text-expriviaOrange';
    }
}