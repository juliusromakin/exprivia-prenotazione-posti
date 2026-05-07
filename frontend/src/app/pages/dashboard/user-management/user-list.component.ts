import {
  Component,
  OnInit,
  OnDestroy,
  HostListener
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil, Observable } from "rxjs";
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

import { User } from "@core/models";
import { UserManagementService } from "./user-management.service";
import { UserFormDialogComponent } from "./user-form-dialog.component";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-user-list",
  templateUrl: "./user-list.component.html",
  standalone: true,

  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule,
    UserFormDialogComponent,
    ToastModule,
    ConfirmationModalComponent,
    TranslateModule
  ],
  providers: [],
  styleUrls: ['../../../shared/styles/toast.styles.css', './user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  loading$: Observable<boolean>;
  searchTerm = "";
  private destroy$ = new Subject<void>();
  currentFilter: 'all' | 'admin' | 'user' | 'inactive' = 'all';
  openDropdownId: number | null = null;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 25;
  totalItems = 0;
  totalPages = 0;
  pageOptions = [10, 25, 50, 100];
  
  // Pagination helper arrays
  pageNumbers: number[] = [];

  // Modal state
  showModal = false;
  isModalLoading = false;
  modalData: { title: string; user: Partial<User> } = { title: '', user: {} };

  // Add new properties for confirmation modal
  showDeleteConfirmation = false;
  userToDelete: User | null = null;

  constructor(
    private userManagementService: UserManagementService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {
    this.loading$ = this.userManagementService.loading$;
  }

  ngOnInit(): void {
    this.loadUsers();

    // Initialize pagination
    this.updatePagination();

    // Sottoscrizione agli utenti filtrati
    this.userManagementService
      .getFilteredUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
        this.applyCurrentFilter();
      });
  }

  async loadUsers(): Promise<void> {
    try {
      await this.userManagementService.loadUsers();
    } catch (error) {
      this.toastService.showError(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.LOADING_ERROR'),
        this.translate.instant('USER_MANAGEMENT.MESSAGES.LOADING_ERROR_DESC')
      );
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue;
    this.applyCurrentFilter();
  }

  private applyCurrentFilter(): void {
    // Start with all users
    let filtered = [...this.users];

    // Apply role filter
    if (this.currentFilter === 'admin') {
      filtered = filtered.filter(user => user.badges?.includes('ROLE_ADMIN'));
    } else if (this.currentFilter === 'user') {
      filtered = filtered.filter(user => !user.badges?.includes('ROLE_ADMIN'));
    } else if (this.currentFilter === 'inactive') {
      filtered = filtered.filter(user => !user.enabled);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredUsers = filtered;
    this.currentPage = 1; // Reset to first page when filtering
    this.updatePagination();
  }

  createUser(): void {
    this.modalData = { title: this.translate.instant('USER_MANAGEMENT.NEW_USER'), user: {} };
    this.showModal = true;
  }

  async onModalSubmit(userData: any): Promise<void> {
    if (!userData) {
      this.closeModal();
      return;
    }

    try {
      this.isModalLoading = true;
      if (this.modalData.user.id) {
        await this.userManagementService.updateUser(this.modalData.user.id!, userData);
        this.toastService.showSuccess(
          this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_UPDATED'),
          this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_UPDATED_DESC')
        );
      } else {
        await this.userManagementService.createUser(userData);
        this.toastService.showSuccess(
          this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_CREATED'),
          this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_CREATED_DESC')
        );
      }
      this.closeModal();
    } catch (error) {
      this.toastService.showError(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.OPERATION_ERROR'),
        this.modalData.user.id 
          ? this.translate.instant('USER_MANAGEMENT.MESSAGES.UPDATE_ERROR') 
          : this.translate.instant('USER_MANAGEMENT.MESSAGES.CREATE_ERROR')
      );
    } finally {
      this.isModalLoading = false;
    }
  }

  editUser(user: User): void {
    this.modalData = { title: this.translate.instant('USER_MANAGEMENT.TABLE.ACTION_EDIT'), user: { ...user } };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isModalLoading = false;
    this.modalData = { title: '', user: {} };
  }

  async deleteUser(user: User): Promise<void> {
    this.userToDelete = user;
    this.showDeleteConfirmation = true;
    document.body.classList.add('overflow-hidden');
  }

  async confirmDelete(): Promise<void> {
    if (!this.userToDelete || !this.userToDelete.id) {
      return;
    }

    try {
      await this.userManagementService.deleteUser(this.userToDelete.id);
      this.toastService.showSuccess(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_DELETED'),
        this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_DELETED_DESC')
      );
      this.closeDeleteConfirmation();
    } catch (error) {
      this.toastService.showError(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.DELETE_ERROR'),
        this.translate.instant('USER_MANAGEMENT.MESSAGES.DELETE_ERROR_DESC')
      );
      this.closeDeleteConfirmation();
    }
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.userToDelete = null;
    document.body.classList.remove('overflow-hidden');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // User counting methods
  getTotalUsers(): number {
    return this.users.length;
  }

  getAdminCount(): number {
    return this.users.filter(user => 
      user.badges?.includes('ROLE_ADMIN')
    ).length;
  }

  getUserCount(): number {
    return this.users.filter(user => 
      !user.badges?.includes('ROLE_ADMIN')
    ).length;
  }

  getInactiveCount(): number {
  return this.users.filter(user => !user.enabled).length;
  }
  
  // Role filtering
  filterByRole(role: 'all' | 'admin' | 'user' | 'inactive'): void {
    this.currentFilter = role;
    this.applyCurrentFilter();
  }

  // Pagination methods
  updatePagination(): void {
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    // Calculate start and end indices
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    // Get paginated items
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    
    // Generate page numbers for pagination controls
    this.generatePageNumbers();
  }

  generatePageNumbers(): void {
    const maxVisiblePages = 5;
    this.pageNumbers = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onItemsPerPageChange(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  goToFirstPage(): void {
    this.onPageChange(1);
  }

  goToLastPage(): void {
    this.onPageChange(this.totalPages);
  }

  goToPreviousPage(): void {
    this.onPageChange(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.onPageChange(this.currentPage + 1);
  }

  getStartIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  toggleDropdown(userId: number): void {
    this.openDropdownId = this.openDropdownId === userId ? null : userId;
  }

  // Add click outside listener to close dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-user-id]')) {
      this.openDropdownId = null;
    }
  }

  shouldOpenUpward(userId: number): boolean {
    // Use a simple heuristic: check if we're in the last few rows of the table
    const index = this.paginatedUsers.findIndex(u => u.id === userId);
    const totalItems = this.paginatedUsers.length;
    
    // If we're in the last 2 items of the current page, open upward
    if (index >= totalItems - 2) {
      return true;
    }

    // Also check viewport position as backup
    try {
      const buttonElement = document.querySelector(`[data-user-id="${userId}"]`) as HTMLElement;
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        return rect.bottom > viewportHeight - 120; // 120px buffer for dropdown
      }
    } catch (error) {
      // Fallback to index-based logic
    }
    
    return false;
  }

  getUserDeleteConfirmationMessage(): string {
    if (!this.userToDelete) {
      return '';
    }

    const user = this.userToDelete;
    const isAdmin = user.badges && user.badges.includes('ROLE_ADMIN');
    
    const roleString = isAdmin ? this.translate.instant('USER_MANAGEMENT.TABLE.ROLE_ADMIN') : this.translate.instant('USER_MANAGEMENT.TABLE.ROLE_EMPLOYEE');

    const message = [
      this.translate.instant('USER_MANAGEMENT.MESSAGES.CONFIRM_DELETE_MSG1', { name: user.name, lastName: user.lastName }),
      '',
      this.translate.instant('USER_MANAGEMENT.MESSAGES.CONFIRM_DELETE_NAME', { name: user.name, lastName: user.lastName }),
      this.translate.instant('USER_MANAGEMENT.MESSAGES.CONFIRM_DELETE_EMAIL', { email: user.email }),
      this.translate.instant('USER_MANAGEMENT.MESSAGES.CONFIRM_DELETE_ROLE', { role: roleString }),
      '',
      this.translate.instant('USER_MANAGEMENT.MESSAGES.CONFIRM_DELETE_UNDONE')
    ];

    return message.join('<br>');
  }

  async activateUser(user: User): Promise<void> {
    try {
      await this.userManagementService.updateUser(user.id!, {
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        badges: user.badges,
        enabled: true
      });
      
      this.toastService.showSuccess(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_ACTIVATED_TITLE'),
        this.translate.instant('USER_MANAGEMENT.MESSAGES.USER_ACTIVATED_DESC', { name: user.name })
      );
    } catch (error) {
      this.toastService.showError(
        this.translate.instant('USER_MANAGEMENT.MESSAGES.ACTIVATION_ERROR_TITLE'),
        this.translate.instant('USER_MANAGEMENT.MESSAGES.ACTIVATION_ERROR_DESC')
      );
    }
  }

  getBadgeClass(badge: string): string {
    if (badge === 'ROLE_ADMIN') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (badge === 'ROLE_USER') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (badge.startsWith('ROLE_')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  formatBadgeName(badge: string): string {
    return badge.replace(/^ROLE_/, '').replace(/_/g, ' ');
  }
}
