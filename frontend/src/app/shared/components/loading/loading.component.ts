import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [ngClass]="containerClass">
      <div class="text-center">
        <div class="relative mx-auto"
             [ngClass]="{
               'h-8 w-8': size === 'sm',
               'h-12 w-12': size === 'md',
               'h-16 w-16': size === 'lg'
             }">
          <!-- Outer ring -->
          <div class="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
               [ngClass]="{
                 'border-expriviaOrange': color === 'primary',
                 'border-gray-600': color === 'secondary',
                 'border-white': color === 'white'
               }">
          </div>
          <!-- Inner ring -->
          <div class="absolute inset-1 rounded-full border-2 border-b-transparent animate-spin-reverse"
               [ngClass]="{
                 'border-expriviaOrange': color === 'primary',
                 'border-gray-600': color === 'secondary',
                 'border-white': color === 'white'
               }">
          </div>
        </div>
        <p *ngIf="message" 
           class="mt-4 text-sm font-medium"
           [ngClass]="{
             'text-gray-600': color === 'primary' || color === 'secondary',
             'text-white': color === 'white'
           }">
          {{message}}
        </p>
      </div>
    </div>
  `,
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: 'primary' | 'secondary' | 'white' = 'primary';
  @Input() containerClass: string = 'min-h-[60vh]';
} 