import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) {}

  /**
   * Show a success toast message
   * @param summary - Brief title for the message (can be a translation key)
   * @param detail - Detailed message content (can be a translation key)
   * @param life - Auto-dismiss time in milliseconds (default: 5000ms)
   */
  showSuccess(summary: string, detail: string, life: number = 5000): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life
    });
  }

  /**
   * Show an error toast message
   * @param summary - Brief title for the message
   * @param detail - Detailed message content
   * @param life - Auto-dismiss time in milliseconds (default: 8000ms)
   */
  showError(summary: string, detail: string, life: number = 8000): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life
    });
  }

  /**
   * Automatically handles API errors and shows an error toast.
   * @param err - The error object from the API
   * @param defaultSummary - The summary to show if not provided (default: 'Errore')
   */
  handleError(err: any, defaultSummary: string = 'Errore'): void {
    console.error('API Error details:', err);
    
    let detail = 'Si è verificato un errore imprevisto';
    
    if (err.error && typeof err.error === 'object') {
      detail = err.error.message || err.error.error || detail;
    } else if (typeof err.error === 'string') {
      detail = err.error;
    } else if (err.message) {
      detail = err.message;
    }

    this.showError(defaultSummary, detail);
  }

  /**
   * Show an info toast message
   * @param summary - Brief title for the message
   * @param detail - Detailed message content
   * @param life - Auto-dismiss time in milliseconds (default: 6000ms)
   */
  showInfo(summary: string, detail: string, life: number = 6000): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life
    });
  }

  /**
   * Show a warning toast message
   * @param summary - Brief title for the message
   * @param detail - Detailed message content
   * @param life - Auto-dismiss time in milliseconds (default: 7000ms)
   */
  showWarning(summary: string, detail: string, life: number = 7000): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life
    });
  }

  /**
   * Clear all existing toasts
   */
  clearAll(): void {
    this.messageService.clear();
  }

  /**
   * Clear a specific toast by key
   * @param key - The key of the toast to clear
   */
  clear(key?: string): void {
    this.messageService.clear(key);
  }
} 