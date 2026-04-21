import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Subject, of, forkJoin } from "rxjs";
import { CommonModule, DatePipe } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { CalendarComponent } from "@shared/components/calendar/calendar.component";
import { RoomService } from "@core/services/room.service";
import { ReservationService } from "@core/services/reservation.service";
import { Room, Workspace, Reservation, ReservationRequest, ReservationStatus, RoomType } from "@core/models";
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '@core/models/user.model';
import { AdminService } from '@core/services/admin.service';
import { map, catchError, switchMap, takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { PlanimetriaInlineComponent } from '../planimetria-inline/planimetria-inline.component';

@Component({
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    CalendarComponent, 
    ToastModule,
    ConfirmationModalComponent,
    PlanimetriaInlineComponent
  ],
  providers: [DatePipe],
  selector: "app-prenotazione-posizione",
  templateUrl: "./prenotazione-posizione.component.html",
  styleUrls: ['../../../shared/styles/toast.styles.css']
})
export class PrenotazionePosizioneComponent implements OnInit, OnDestroy {
  bookingForm: FormGroup;
  state = {
    rooms: [] as Room[],
    availableWorkspaces: [] as any[],
    selectedDates: [] as Date[],
    availableTimeSlots: [] as { startTime: string; endTime: string }[],
    isLoading: false,
    errorMessage: ""
  };

  roomTypes: string[] = [];
  reservations: Reservation[] = [];
  sortedReservations: Reservation[] = [];
  private destroy$ = new Subject<void>();

  // Sorting properties
  sortColumn: string = 'startDate'; // Default sort by date
  sortDirection: 'asc' | 'desc' = 'desc'; // Default to descending (latest first)

  // Filter properties
  statusFilter: 'tutti' | 'attive' | 'scadute' | 'annullate' = 'attive'; // Default to active

  // Admin and user selection properties
  isAdmin = false;
  users: User[] = [];
  userSearchTerm: string = '';
  filteredUsers: User[] = [];
  showUserDropdown: boolean = false;
  selectedUser: User | null = null;

  // Bulk selection properties
  selectedReservations: Set<number> = new Set();
  isSelectAllChecked: boolean = false;

  // Map duration label to minutes
  readonly durationMap: { [key: string]: number } = {
    'Giornata Intera': 540,
    '4 ore': 240,
    '2 ore': 120,
    '1 ora': 60,
    '30 minuti': 30
  };

  // Add new properties for confirmation modal
  showBulkCancelConfirmation = false;
  reservationsToCancel: Reservation[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private roomService: RoomService,
    private reservationService: ReservationService,
    private toastService: ToastService,
    private adminService: AdminService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {
    this.bookingForm = this.fb.group({
      selectedDate: [null, Validators.required],
      roomType: ["", Validators.required],
      roomId: [null, Validators.required],
      slotDuration: ["", Validators.required],
      timeSlot: ["", Validators.required],
      workspaceId: ["", Validators.required],
      userId: [null]
    });
  }

  private getDurationInMinutes(durationName: string | null | undefined): number {
    if (!durationName) return 0;
    const name = String(durationName).trim().toLowerCase();
    
    if (/intera/i.test(name) || /giorn/i.test(name)) return 540;
    if (/4.*ore/i.test(name) || /4h/i.test(name)) return 240;
    if (/2.*ore/i.test(name) || /2h/i.test(name) || /120.*min/i.test(name)) return 120;
    if (/1.*ora/i.test(name) || /1h/i.test(name) || /60.*min/i.test(name)) return 60;
    if (/30.*min/i.test(name) || /30m/i.test(name)) return 30;
    
    return 0;
  }

  isFullDay(duration: string | null | undefined): boolean {
    if (!duration) return false;
    const name = String(duration).trim().toLowerCase();
    return /intera/i.test(name) || /giorn/i.test(name);
  }

  isMeetingRoom(): boolean {
    const type = this.bookingForm.get('roomType')?.value;
    return type === RoomType.MEETING_ROOM || type === 'MeetingRoom' || type === 'MEETINGROOM';
  }

  get availableDurations(): string[] {
    const durations = new Set<string>();
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const selectedDate = this.bookingForm.get('selectedDate')?.value || this.state.selectedDates[0];
    
    if (!selectedDate) return [];
    
    const isToday = this.isSameDay(selectedDate, now);

    const checkAndAddDuration = (name: string, mins: number) => {
      if (isToday) {
        const latestStartHour = 18 - (mins / 60);
        const latestStartInMinutes = latestStartHour * 60;
        if (latestStartInMinutes > (currentTimeInMinutes + 30)) {
          durations.add(name);
        }
      } else {
        durations.add(name);
      }
    };

    Object.keys(this.durationMap).forEach(name => {
      const mins = this.durationMap[name];
      if (name === 'Giornata Intera') {
        if (!isToday || (8 * 60) > (currentTimeInMinutes + 30)) {
          durations.add(name);
        }
      } else {
        checkAndAddDuration(name, mins);
      }
    });

    return Array.from(durations).sort((a, b) => {
      const minsA = this.getDurationInMinutes(a);
      const minsB = this.getDurationInMinutes(b);
      return minsB - minsA;
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadBookingInfo();
    this.setupFormSubscriptions();
    this.loadMyReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookingInfo(): void {
    this.state.isLoading = true;
    this.roomService.getAllRooms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rooms) => {
          this.state.rooms = rooms;
          this.roomTypes = [...new Set(rooms.map((r: Room) => r.roomType))].filter(Boolean) as string[];
          this.state.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading information:', err);
          this.state.errorMessage = "Error loading information";
          this.toastService.showError('Loading Error', 'Unable to load room information.');
          this.state.isLoading = false;
        }
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get("roomType")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.bookingForm.patchValue({
          roomId: null,
          workspaceId: "",
          slotDuration: "",
          timeSlot: ""
        });

        if (type) {
          const filteredRooms = this.state.rooms.filter(s => s.roomType === type || (typeof s.roomType === 'string' && s.roomType.toUpperCase() === String(type).toUpperCase()));
          const allWorkspaces: any[] = filteredRooms
            .flatMap(room => (room.workspaces || []).map(w => ({
              ...w,
              roomId: room.id!,
              roomName: room.name!,
              roomType: room.roomType!
            })));

          if (this.isMeetingRoom()) {
            const uniqueRooms = new Map<number, any>();
            allWorkspaces.forEach(w => {
              if (!uniqueRooms.has(w.roomId)) {
                uniqueRooms.set(w.roomId, { ...w, name: w.roomName });
              }
            });
            this.state.availableWorkspaces = Array.from(uniqueRooms.values());
          } else {
            this.state.availableWorkspaces = allWorkspaces;
          }
        } else {
          this.state.availableWorkspaces = [];
        }
      });

    this.bookingForm.get("slotDuration")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(duration => {
        this.bookingForm.patchValue({ timeSlot: "", workspaceId: "" });
        if (duration && (this.bookingForm.get('selectedDate')?.value || this.state.selectedDates.length > 0)) {
          this.generateTimeSlotsForDuration(duration, this.bookingForm.get('selectedDate')?.value || this.state.selectedDates[0]);
        } else {
          this.state.availableTimeSlots = [];
        }
      });

    this.bookingForm.get("timeSlot")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeSlot => {
        this.bookingForm.patchValue({ workspaceId: "" });
        if (timeSlot) this.updateWorkspacesAvailability();
      });

    this.bookingForm.get("workspaceId")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspaceId => {
        if (workspaceId) {
          const selectedWorkspace = this.state.availableWorkspaces.find(p => p.id === Number(workspaceId));
          if (selectedWorkspace) this.bookingForm.patchValue({ roomId: selectedWorkspace.roomId });
        } else {
          this.bookingForm.patchValue({ roomId: null }, { emitEvent: false });
        }
      });
  }

  private generateTimeSlotsForDuration(duration: string, date: Date): void {
    const slots: { startTime: string; endTime: string }[] = [];
    const startHour = 8;
    const endHour = 18;
    const durationMinutes = this.getDurationInMinutes(duration);
    if (!durationMinutes) { this.state.availableTimeSlots = []; return; }

    const today = new Date();
    const isToday = this.isSameDay(date, today);
    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();

    if (this.isFullDay(duration)) {
      if (!isToday || (8 * 60) > (currentTimeInMinutes + 30)) slots.push({ startTime: '08:00', endTime: '17:00' });
      if (!isToday || (9 * 60) > (currentTimeInMinutes + 30)) slots.push({ startTime: '09:00', endTime: '18:00' });
    } else {
      const step = durationMinutes >= 60 ? 60 : 30;
      for (let hour = startHour; hour < endHour; hour += step / 60) {
        const start = hour;
        const end = hour + durationMinutes / 60;
        if (end > endHour) continue;
        if (isToday && (start * 60) <= (currentTimeInMinutes + 30)) continue;

        const startTime = `${Math.floor(start).toString().padStart(2, '0')}:${(start % 1 === 0.5 ? '30' : '00')}`;
        const endTime = `${Math.floor(end).toString().padStart(2, '0')}:${(end % 1 === 0.5 ? '30' : '00')}`;
        slots.push({ startTime, endTime });
      }
    }
    this.state.availableTimeSlots = [...slots];
    this.cdr.detectChanges();
  }

  private updateWorkspacesAvailability(): void {
    const selectedTimeSlot = this.bookingForm.get('timeSlot')?.value;
    const selectedDate = this.bookingForm.get('selectedDate')?.value || this.state.selectedDates[0];
    if (!selectedTimeSlot || !selectedDate) return;

    const [startTime, endTime] = selectedTimeSlot.split(' - ');
    const slotString = `${startTime} - ${endTime}`;
    
    const availabilityChecks = this.state.availableWorkspaces.map(workspace => 
      this.reservationService.getAvailableTimeSlots(selectedDate, workspace.id!)
        .pipe(
          map(availableSlots => ({
            ...workspace,
            isAvailable: availableSlots.includes(slotString)
          })),
          catchError(() => of({ ...workspace, isAvailable: false }))
        )
    );

    forkJoin(availabilityChecks)
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspaces => {
        this.state.availableWorkspaces = workspaces.sort((a, b) => {
          if (a.isAvailable && !b.isAvailable) return -1;
          if (!a.isAvailable && b.isAvailable) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
      });
  }

  onDateSelectionChange(dates: Date[]): void {
    const selected = dates && dates.length > 0 ? [dates[0]] : [];
    this.state.selectedDates = [...selected];
    this.bookingForm.patchValue({ selectedDate: selected[0] });
    this.state.availableWorkspaces = this.state.availableWorkspaces.map(p => ({ ...p, isAvailable: undefined }));
  }

  onWorkspaceSelectedFromPlanimetria(workspaceId: number): void {
    const selectedWorkspace = this.state.availableWorkspaces.find(p => p.id === workspaceId);
    if (!selectedWorkspace) return;
    this.bookingForm.patchValue({ workspaceId: String(workspaceId), roomId: selectedWorkspace.roomId });
    this.cdr.detectChanges();
  }

  getWorkspaceName(workspaceId: any): string {
    if (!workspaceId) return '';
    const w = this.state.availableWorkspaces.find(p => p.id === Number(workspaceId));
    return w ? `${w.name} - ${w.roomName}` : `Workspace ${workspaceId}`;
  }

  getSelectedWorkspaceId(): number | null {
    const val = this.bookingForm.get('workspaceId')?.value;
    return val ? Number(val) : null;
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      const formData = this.bookingForm.value;
      this.state.isLoading = true;
      
      const startDateTime = new Date(formData.selectedDate);
      const endDateTime = new Date(formData.selectedDate);
      const [start, end] = formData.timeSlot.split(' - ');
      const [startH, startM] = start.split(':');
      const [endH, endM] = end.split(':');

      startDateTime.setHours(parseInt(startH), parseInt(startM), 0, 0);
      endDateTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

      this.authService.getIdentity().pipe(
        takeUntil(this.destroy$),
        switchMap(user => {
          const userId = formData.userId ? parseInt(formData.userId) : (user?.id || 0);
          
          const reservation: ReservationRequest = {
            workspaceId: parseInt(formData.workspaceId),
            userId: userId,
            startDate: startDateTime,
            endDate: endDateTime,
            durationName: formData.slotDuration
          };

          return this.reservationService.createReservation(reservation);
        })
      ).subscribe({
        next: () => {
          this.toastService.showSuccess('Confirmed', 'Reservation created successfully');
          this.resetForm();
          this.loadMyReservations();
          this.state.isLoading = false;
        },
        error: (err) => {
          this.toastService.showError('Error', err.message || 'Failed to create reservation');
          this.state.isLoading = false;
        }
      });
    }
  }

  private resetForm(): void {
    this.bookingForm.reset({ roomType: "" });
    this.state.selectedDates = [];
    this.state.availableTimeSlots = [];
    if (this.isAdmin) this.clearUserSearch();
  }

  isFormValid(): boolean {
    return this.bookingForm.valid;
  }

  private loadMyReservations(): void {
    this.state.isLoading = true;
    this.authService.getIdentity().pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (!user || !user.email) return of([]);
        return this.reservationService.getReservationsByEmail(user.email);
      })
    ).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.applySorting();
        this.state.isLoading = false;
      },
      error: () => {
        this.toastService.showError('Error', 'Unable to load reservations');
        this.state.isLoading = false;
      }
    });
  }

  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  formatDate(date: any, format: string): string {
    const d = new Date(date);
    return this.isValidDate(d) ? this.datePipe.transform(d, format)! : 'Invalid Date';
  }

  getFormattedTimeRange(start: any, end: any): string {
    return `${this.formatDate(start, 'HH:mm')} - ${this.formatDate(end, 'HH:mm')}`;
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.applySorting();
  }

  private applySorting(): void {
    this.sortedReservations = this.filteredReservations.sort((a, b) => {
      let vA: any, vB: any;
      if (this.sortColumn === 'startDate') { vA = new Date(a.startDate); vB = new Date(b.startDate); }
      else { vA = (a as any)[this.sortColumn]; vB = (b as any)[this.sortColumn]; }
      if (vA < vB) return this.sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fas fa-sort text-gray-400';
    return this.sortDirection === 'asc' ? 'fas fa-sort-up text-blue-600' : 'fas fa-sort-down text-blue-600';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column;
  }

  setStatusFilter(status: any): void {
    this.statusFilter = status;
    this.applySorting();
  }

  getStatusFilterCount(status: string): number {
    const now = new Date();
    if (status === 'tutti') return this.reservations.length;
    return this.reservations.filter(r => {
      const isPast = new Date(r.endDate) <= now;
      if (status === 'attive') return r.status === ReservationStatus.CONFIRMED && !isPast;
      if (status === 'scadute') return isPast;
      if (status === 'annullate') return r.status === ReservationStatus.DENIED;
      return true;
    }).length;
  }

  get filteredReservations(): Reservation[] {
    const now = new Date();
    if (this.statusFilter === 'tutti') return this.reservations;
    return this.reservations.filter(r => {
      const isPast = new Date(r.endDate) <= now;
      if (this.statusFilter === 'attive') return r.status === ReservationStatus.CONFIRMED && !isPast;
      if (this.statusFilter === 'scadute') return isPast;
      if (this.statusFilter === 'annullate') return r.status === ReservationStatus.DENIED;
      return true;
    });
  }

  onMonthChange(date: Date): void { console.log('Month changed:', date); }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  private checkUserRole(): void {
    this.authService.getIdentity().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAdmin = user?.authorities?.includes('ROLE_ADMIN') || false;
      if (this.isAdmin) this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.adminService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => { this.users = users; this.filteredUsers = users; },
      error: () => this.toastService.showError('Error', 'Unable to load users')
    });
  }

  filterUsers(): void {
    if (!this.userSearchTerm) { this.filteredUsers = this.users; this.selectedUser = null; this.bookingForm.patchValue({ userId: null }); return; }
    const term = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => `${u.name} ${u.lastName} ${u.email}`.toLowerCase().includes(term));
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.userSearchTerm = `${user.name} ${user.lastName}`;
    this.bookingForm.patchValue({ userId: user.id });
    this.showUserDropdown = false;
  }

  clearUserSearch(): void {
    this.userSearchTerm = '';
    this.selectedUser = null;
    this.bookingForm.patchValue({ userId: null });
    this.filteredUsers = this.users;
    this.showUserDropdown = false;
  }

  onUserInputBlur(): void { setTimeout(() => this.showUserDropdown = false, 200); }

  trackByUser(index: number, user: User): any { return user.id; }

  canCancelPrenotazione(r: Reservation): boolean {
    return r.status !== ReservationStatus.DENIED && new Date(r.endDate) > new Date();
  }

  cancelPrenotazione(r: Reservation): void {
    this.reservationsToCancel = [r];
    this.showBulkCancelConfirmation = true;
  }

  bulkCancelPrenotazioni(): void {
    this.reservationsToCancel = this.reservations.filter(r => this.selectedReservations.has(r.id!));
    this.showBulkCancelConfirmation = true;
  }

  confirmBulkCancel(): void {
    const requests = this.reservationsToCancel.map(r => this.reservationService.deleteReservation(r.id!));
    this.state.isLoading = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.toastService.showSuccess('Success', 'Reservations cancelled');
        this.loadMyReservations();
        this.selectedReservations.clear();
        this.isSelectAllChecked = false;
        this.closeBulkCancelConfirmation();
      },
      error: () => {
        this.toastService.showError('Error', 'Failed to cancel reservations');
        this.state.isLoading = false;
      }
    });
  }

  closeBulkCancelConfirmation(): void { this.showBulkCancelConfirmation = false; this.reservationsToCancel = []; }

  toggleSelectAll(): void {
    if (this.isSelectAllChecked) this.selectedReservations.clear();
    else this.reservations.filter(r => this.canCancelPrenotazione(r)).forEach(r => this.selectedReservations.add(r.id!));
    this.isSelectAllChecked = !this.isSelectAllChecked;
  }

  toggleSelectPrenotazione(id: number): void {
    if (this.selectedReservations.has(id)) { this.selectedReservations.delete(id); this.isSelectAllChecked = false; }
    else { this.selectedReservations.add(id); this.isSelectAllChecked = this.selectedReservations.size === this.reservations.filter(r => this.canCancelPrenotazione(r)).length; }
  }

  isPrenotazioneSelected(id: number): boolean { return this.selectedReservations.has(id); }

  getActivePrenotazioni(): Reservation[] {
    const now = new Date();
    return this.reservations.filter(r => r.status === ReservationStatus.CONFIRMED && new Date(r.endDate) > now);
  }

  canShowCheckbox(r: Reservation): boolean { return this.canCancelPrenotazione(r); }

  getSelectedCount(): number { return this.selectedReservations.size; }
}
