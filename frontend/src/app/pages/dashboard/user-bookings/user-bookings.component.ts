import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../shared/services/toast.service';
import { Reservation, ReservationStatus } from '@core/models';
import { ReservationService, RoomService, AdminService } from '@core/services';
import { AuthService } from '@core/auth/auth.service';
import * as XLSX from 'xlsx';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { User, Room, Workspace } from '@core/models';
import { switchMap, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-bookings',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    FormsModule, 
    ToastModule,
    ConfirmationModalComponent,
    TranslateModule
  ],
  providers: [DatePipe],
  templateUrl: './user-bookings.component.html',
  styleUrls: ['../../../shared/styles/toast.styles.css']
})
export class UserBookingsComponent implements OnInit, OnDestroy {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  paginatedReservations: Reservation[] = [];
  isLoading = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();

  // Sorting properties
  sortColumn: string = 'startDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Search and Filter
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'expired' | 'cancelled' = 'active';

  // Pagination
  currentPage = 1;
  itemsPerPage = 25;
  totalItems = 0;
  totalPages = 0;
  pageOptions = [10, 25, 50, 100];
  pageNumbers: number[] = [];

  // Delete confirmation
  showDeleteConfirmation = false;
  reservationToDelete: Reservation | null = null;

  // Export
  isExporting = false;
  showExportModal = false;
  selectedExportPeriod: 'week' | 'month' | '6months' | null = null;
  exportPeriods = [
    { value: 'week', label: 'LAST_WEEK' },
    { value: 'month', label: 'LAST_MONTH' },
    { value: '6months', label: 'LAST_6_MONTHS' }
  ];
  selectedExportType: 'period' | 'daily' = 'period';
  exportDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private toastService: ToastService,
    private datePipe: DatePipe,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserRole(): void {
    this.authService.getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = user?.badges?.includes('ROLE_ADMIN') || false;
      });
  }

  loadReservations(): void {
    this.isLoading = true;
    this.authService.getIdentity().pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        this.isAdmin = user?.badges?.includes('ROLE_ADMIN') || false;
        if (this.isAdmin) {
          return this.reservationService.getReservations();
        } else if (user?.email) {
          return this.reservationService.getReservationsByEmail(user.email);
        } else {
          return of([]);
        }
      })
    ).subscribe({
      next: (reservations) => {
        this.reservations = reservations.map(r => ({
          ...r,
          startDate: new Date(r.startDate),
          endDate: new Date(r.endDate),
          status: r.status || ReservationStatus.NOT_CONFIRMED
        }));
        this.applySorting();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.toastService.showError(
          this.translate.instant('RESERVATIONS.MESSAGES.ERROR'),
          this.translate.instant('RESERVATIONS.MESSAGES.ERROR_LOADING')
        );
        this.isLoading = false;
      }
    });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation.id) return;
    this.reservationToDelete = reservation;
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (!this.reservationToDelete?.id) return;
    this.isLoading = true;
    this.reservationService.deleteReservation(this.reservationToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('RESERVATIONS.MESSAGES.SUCCESS'),
            this.translate.instant('RESERVATIONS.MESSAGES.DELETE_SUCCESS')
          );
          this.reservations = this.reservations.filter(r => r.id !== this.reservationToDelete?.id);
          this.applySorting();
          this.isLoading = false;
          this.closeDeleteConfirmation();
        },
        error: () => {
          this.toastService.showError(
            this.translate.instant('RESERVATIONS.MESSAGES.ERROR'),
            this.translate.instant('RESERVATIONS.MESSAGES.DELETE_ERROR')
          );
          this.isLoading = false;
          this.closeDeleteConfirmation();
        }
      });
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.reservationToDelete = null;
  }

  formatDate(date: any, format: string): string {
    return this.datePipe.transform(date, format) || 'N/A';
  }

  getFormattedTimeRange(start: any, end: any): string {
    return `${this.formatDate(start, 'HH:mm')} - ${this.formatDate(end, 'HH:mm')}`;
  }

  openNewBookingModal(): void {
    this.router.navigate(['/dashboard/workspace-booking']);
  }

  setStatusFilter(status: any): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  getStatusFilterCount(status: string): number {
    if (status === 'all') return this.reservations.length;
    const now = new Date();
    return this.reservations.filter(r => {
      const isPast = new Date(r.endDate) <= now;
      if (status === 'active') return (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.NOT_CONFIRMED) && !isPast;
      if (status === 'expired') return isPast && r.status !== ReservationStatus.DENIED;
      if (status === 'cancelled') return r.status === ReservationStatus.DENIED;
      return true;
    }).length;
  }

  applySearchFilter(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.reservations];
    const now = new Date();

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.userSummary?.name?.toLowerCase().includes(term) ||
        r.userSummary?.lastName?.toLowerCase().includes(term) ||
        r.roomSummary?.name?.toLowerCase().includes(term) ||
        r.workspaceSummary?.name?.toLowerCase().includes(term) ||
        r.cityName?.toLowerCase().includes(term) ||
        r.locationName?.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => {
        const isPast = new Date(r.endDate) <= now;
        if (this.statusFilter === 'active') return (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.NOT_CONFIRMED) && !isPast;
        if (this.statusFilter === 'expired') return isPast && r.status !== ReservationStatus.DENIED;
        if (this.statusFilter === 'cancelled') return r.status === ReservationStatus.DENIED;
        return true;
      });
    }

    this.filteredReservations = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePagination();
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.applySorting();
  }

  private applySorting(): void {
    this.applyFilters();
    this.filteredReservations.sort((a, b) => {
      let vA: any, vB: any;
      if (this.sortColumn === 'startDate') { vA = new Date(a.startDate).getTime(); vB = new Date(b.startDate).getTime(); }
      else if (this.sortColumn === 'user') { vA = `${a.userSummary?.name} ${a.userSummary?.lastName}`; vB = `${b.userSummary?.name} ${b.userSummary?.lastName}`; }
      else if (this.sortColumn === 'city') { vA = a.cityName || ''; vB = b.cityName || ''; }
      else if (this.sortColumn === 'location') { vA = a.locationName || ''; vB = b.locationName || ''; }
      else { vA = (a as any)[this.sortColumn]; vB = (b as any)[this.sortColumn]; }
      
      if (vA < vB) return this.sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = Math.max(1, this.totalPages);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReservations = this.filteredReservations.slice(start, start + this.itemsPerPage);
    this.generatePageNumbers();
  }

  generatePageNumbers(): void {
    this.pageNumbers = Array.from({ length: Math.min(5, this.totalPages) }, (_, i) => {
      let start = Math.max(1, this.currentPage - 2);
      if (start + 4 > this.totalPages) start = Math.max(1, this.totalPages - 4);
      return start + i;
    }).filter(p => p <= this.totalPages);
  }

  onPageChange(page: number): void { this.currentPage = page; this.updatePagination(); }
  onItemsPerPageChange(size: number): void { this.itemsPerPage = size; this.currentPage = 1; this.updatePagination(); }
  goToFirstPage(): void { this.onPageChange(1); }
  goToLastPage(): void { this.onPageChange(this.totalPages); }
  goToPreviousPage(): void { if (this.currentPage > 1) this.onPageChange(this.currentPage - 1); }
  goToNextPage(): void { if (this.currentPage < this.totalPages) this.onPageChange(this.currentPage + 1); }
  getStartIndex(): number { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fas fa-sort text-gray-400';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up text-blue-600' : 'fas fa-sort-down text-blue-600';
  }

  isSortedColumn(column: string): boolean { return this.sortColumn === column; }

  openExportModal(): void { 
    this.showExportModal = true; 
    this.selectedExportPeriod = null; 
    this.selectedExportType = 'period';
  }
  closeExportModal(): void { this.showExportModal = false; }
  selectExportPeriod(period: any): void { 
    this.selectedExportPeriod = period; 
    this.selectedExportType = 'period';
  }
  selectDailyExport(): void {
    this.selectedExportType = 'daily';
    this.selectedExportPeriod = null;
  }

  confirmExport(): void {
    if (this.selectedExportType === 'daily') {
      this.confirmDailyExport();
    } else {
      this.confirmPeriodExport();
    }
  }

  confirmDailyExport(): void {
    if (!this.exportDate) return;
    this.isExporting = true;
    const dateObj = new Date(this.exportDate);
    
    this.reservationService.exportReservationsDaily(dateObj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reservations_report_${this.exportDate}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastService.showSuccess(
            this.translate.instant('RESERVATIONS.EXPORT'),
            this.translate.instant('RESERVATIONS.MESSAGES.EXPORT_DAILY_SUCCESS')
          );
          this.isExporting = false;
          this.closeExportModal();
        },
        error: (error) => {
          console.error('Export error:', error);
          this.toastService.showError(
            this.translate.instant('RESERVATIONS.EXPORT'),
            this.translate.instant('RESERVATIONS.MESSAGES.EXPORT_DAILY_ERROR')
          );
          this.isExporting = false;
        }
      });
  }

  confirmPeriodExport(): void {
    if (!this.selectedExportPeriod) return;
    const now = new Date();
    const start = new Date();
    if (this.selectedExportPeriod === 'week') start.setDate(now.getDate() - 7);
    else if (this.selectedExportPeriod === 'month') start.setDate(now.getDate() - 30);
    else if (this.selectedExportPeriod === '6months') start.setMonth(now.getMonth() - 6);

    const toExport = this.reservations.filter(r => new Date(r.startDate) >= start);
    const data = toExport.map(r => ({
      'Date': this.formatDate(r.startDate, 'dd/MM/yyyy'),
      'Time': this.getFormattedTimeRange(r.startDate, r.endDate),
      'User': `${r.userSummary?.name} ${r.userSummary?.lastName}`,
      'Email': r.userSummary?.email,
      'City': r.cityName,
      'Location': r.locationName,
      'Room': r.roomSummary?.name,
      'Workspace': r.workspaceSummary?.name,
      'Status': r.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
    XLSX.writeFile(wb, `reservations_${this.selectedExportPeriod}.xlsx`);
    this.toastService.showSuccess(
      this.translate.instant('RESERVATIONS.EXPORT'),
      this.translate.instant('RESERVATIONS.MESSAGES.EXPORT_SUCCESS')
    );
    this.closeExportModal();
  }

  getReservationDeleteConfirmationMessage(): string {
    if (!this.reservationToDelete) return '';
    return this.translate.instant('RESERVATIONS.MESSAGES.CONFIRM_DELETE_MSG', { date: this.formatDate(this.reservationToDelete.startDate, 'dd/MM/yyyy') });
  }
}