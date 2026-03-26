import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  icon?: 'trash' | 'times' | 'exclamation-triangle';
  type?: 'danger' | 'warning';
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('150ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div *ngIf="show" 
         class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
         (click)="onCancel()">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center" 
           [@scaleIn]
           (click)="$event.stopPropagation()">
        
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
               [ngClass]="{'bg-red-100': type === 'danger', 'bg-yellow-100': type === 'warning'}">
            <i class="fas fa-{{icon}} text-xl"
               [ngClass]="{'text-red-600': type === 'danger', 'text-yellow-600': type === 'warning'}"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{data.title}}</h3>
          <p class="text-sm text-gray-500 mb-6" [innerHTML]="data.message"></p>
          <div class="flex justify-center space-x-4">
            <button
              type="button"
              (click)="onCancel()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              {{data.cancelButtonText || 'Annulla'}}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [disabled]="isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700 focus:ring-red-500': type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500': type === 'warning'
              }">
              <i class="fas fa-{{icon}} mr-2"></i>
              {{data.confirmButtonText}}
              <div *ngIf="isLoading" class="ml-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            </button>
          </div>
      </div>
    </div>
  `,
  styles: []
})
export class ConfirmationModalComponent {
  @Input() show = false;
  @Input() data!: ConfirmationModalData;
  @Input() isLoading = false;
  @Input() type: 'danger' | 'warning' = 'danger';
  @Input() icon: 'trash' | 'times' | 'exclamation-triangle' = 'exclamation-triangle';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 