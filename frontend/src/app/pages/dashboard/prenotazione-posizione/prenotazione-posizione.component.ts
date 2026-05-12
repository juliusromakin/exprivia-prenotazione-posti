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
import { WorkspaceService } from "@core/services/workspace.service";
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlanimetriaService } from "@core/services/planimetria.service";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CalendarComponent,
    ToastModule,
    ConfirmationModalComponent,
    PlanimetriaInlineComponent,
    TranslateModule
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

  // Location selection properties
  locations: string[] = ['Roma', 'Milano', 'Molfetta'];
  selectedLocation: string = 'Roma';

  // Bulk selection properties
  selectedReservations: Set<number> = new Set();
  isSelectAllChecked: boolean = false;

  // Map duration label to minutes - synced with DB values from screenshot
  readonly durationMap: { [key: string]: number } = {
    'Full Day': 480,
    '4 hours': 240,
    '1 hour': 60
  };

  // Add new properties for confirmation modal
  showBulkCancelConfirmation = false;
  reservationsToCancel: Reservation[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private roomService: RoomService,
    private workspaceService: WorkspaceService,
    private reservationService: ReservationService,
    private toastService: ToastService,
    private adminService: AdminService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private planimetriaService: PlanimetriaService,
    public translate: TranslateService
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
    const name = String(durationName).trim();

    if (name === 'Full Day') return 480;
    if (name === '4 hours') return 240;
    if (name === '1 hour') return 60;

    return 0;
  }

  isFullDay(duration: string | null | undefined): boolean {
    if (!duration) return false;
    const name = String(duration).trim();
    return name === 'Full Day';
  }

  getDurationLabel(duration: string): string {
    if (this.isFullDay(duration)) return this.translate.instant('BOOKING.TIME.FULL_DAY');
    
    const mapping: { [key: string]: string } = {
      '4 hours': 'BOOKING.TIME.DURATIONS.4_ORE',
      '2 hours': 'BOOKING.TIME.DURATIONS.2_ORE',
      '1 hour': 'BOOKING.TIME.DURATIONS.1_ORA',
      '30 minutes': 'BOOKING.TIME.DURATIONS.30_MINUTI'
    };
    
    const key = mapping[duration];
    return key ? this.translate.instant(key) : duration;
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
        const latestStartHour = 19 - (mins / 60);
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
      if (name === 'Full Day') {
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
    this.state.errorMessage = "";

    let buildingId = 1;
    if (this.selectedLocation === 'Milano') buildingId = 2;
    else if (this.selectedLocation === 'Molfetta') buildingId = 3;

    this.planimetriaService.getPlanimetrieByEdificio(buildingId, true).pipe(
      switchMap(floors => {
        if (!floors || floors.length === 0) return of({ rooms: [], workspaces: [] });

        const planimetryCalls = floors.map(floor =>
          this.planimetriaService.getPlanimetria(floor.id!).pipe(
            map(plan => ({ floor, plan })),
            catchError(() => of({ floor, plan: null }))
          )
        );

        return forkJoin(planimetryCalls).pipe(
          map(results => {
            const allRooms: Room[] = [];
            const allWorkspaces: Workspace[] = [];

            results.forEach(({ floor, plan }) => {
              // Copy to avoid mutating original list cache if any
              const floorRooms: Room[] = floor.rooms ? JSON.parse(JSON.stringify(floor.rooms)) : [];
              const floorWorkspaces: Workspace[] = floor.workspaces ? JSON.parse(JSON.stringify(floor.workspaces)) : [];

              if (plan) {
                // Map room coordinates
                if (plan.rooms) {
                  floorRooms.forEach(r => {
                    const rPos = plan.rooms!.find(p => p.roomId === r.id);
                    if (rPos) {
                      r.mapX = rPos.mapX;
                      r.mapY = rPos.mapY;
                      r.mapWidth = rPos.mapWidth;
                      r.mapHeight = rPos.mapHeight;
                    }
                  });
                }

                // Map workspace coordinates
                if (plan.workspaces) {
                  floorWorkspaces.forEach(w => {
                    const wPos = plan.workspaces!.find(p => p.workspaceId === w.id);
                    if (wPos) {
                      w.mapX = wPos.mapX;
                      w.mapY = wPos.mapY;
                    }
                  });
                }
              }

              allRooms.push(...floorRooms);
              allWorkspaces.push(...floorWorkspaces);
            });

            return { rooms: allRooms, workspaces: allWorkspaces };
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
        next: ({ rooms, workspaces }) => {
          if (rooms.length === 0 && workspaces.length === 0) {
            this.state.errorMessage = "No data found. Please check backend connection.";
          }

          // Merge workspaces into rooms
          this.state.rooms = (rooms as Room[]).map(room => ({
            ...room,
            workspaces: (workspaces as Workspace[]).filter(w => w.roomId === room.id)
          }));

          // Initialize availableWorkspaces with all workspaces enriched with room info
          // Filter out workspaces without coordinates (cannot be shown on map) or at (0,0) (phantom)
          this.state.availableWorkspaces = this.state.rooms.flatMap(room => 
            (room.workspaces || [])
              .filter(w => w.mapX != null && w.mapY != null && (w.mapX > 0 || w.mapY > 0))
              .map(w => ({
                ...w,
                roomId: room.id!,
                roomName: room.name!,
                roomType: room.roomType!
              }))
          );

          this.state.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading information:', err);
          this.state.errorMessage = this.translate.instant('BOOKING.MESSAGES.LOADING_ERROR_DESC');
          this.toastService.showError(
            this.translate.instant('BOOKING.MESSAGES.LOADING_ERROR_TITLE'), 
            this.translate.instant('BOOKING.MESSAGES.LOADING_ERROR_DESC')
          );
          this.state.isLoading = false;
        }
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get("roomType")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        // Only reset room-specific selections, keep time selection
        this.bookingForm.patchValue({
          roomId: null,
          workspaceId: ""
        });
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
          if (selectedWorkspace) {
            const updates: any = {};
            
            // Sync roomType
            if (this.bookingForm.get('roomType')?.value !== selectedWorkspace.roomType) {
              updates.roomType = selectedWorkspace.roomType;
            }
            
            // Sync roomId
            if (this.bookingForm.get('roomId')?.value !== selectedWorkspace.roomId) {
              updates.roomId = selectedWorkspace.roomId;
            }

            if (Object.keys(updates).length > 0) {
              this.bookingForm.patchValue(updates, { emitEvent: false });
            }
          }
        } else {
          this.bookingForm.patchValue({ roomId: null }, { emitEvent: false });
        }
      });

    this.bookingForm.get("roomId")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(roomId => {
        if (roomId) {
          const currentWorkspaceId = this.bookingForm.get('workspaceId')?.value;
          if (currentWorkspaceId) {
            const workspace = this.state.availableWorkspaces.find(p => p.id === Number(currentWorkspaceId));
            if (workspace && workspace.roomId !== Number(roomId)) {
              this.bookingForm.patchValue({ workspaceId: "" });
            }
          }
        } else {
          this.bookingForm.patchValue({ workspaceId: "" });
        }
      });
  }

  get filteredRoomTypes(): string[] {
    const types = Object.values(RoomType) as string[];
    if (this.selectedLocation === 'Roma') {
      return types.filter(t => t !== 'OPEN_SPACE' && t !== RoomType.OPEN_SPACE);
    }
    return types;
  }

  get roomsForSelectedType(): Room[] {
    const type = this.bookingForm.get('roomType')?.value;
    if (!type) return [];

    let rooms = this.state.rooms.filter(r =>
      r.roomType === type ||
      (typeof r.roomType === 'string' && r.roomType.toUpperCase() === String(type).toUpperCase())
    );

    // Se è selezionato un orario, mostra solo le stanze con almeno una postazione disponibile
    const timeSlot = this.bookingForm.get('timeSlot')?.value;
    if (timeSlot) {
      rooms = rooms.filter(room =>
        this.state.availableWorkspaces.some(w => w.roomId === room.id && w.isAvailable === true)
      );
    }

    return rooms;
  }

  get workstationsForSelectedRoom(): any[] {
    const roomId = this.bookingForm.get('roomId')?.value;
    if (!roomId) return [];

    let workspaces = this.state.availableWorkspaces.filter(w => w.roomId === Number(roomId));

    // Se è selezionato un orario, mostra solo le postazioni effettivamente disponibili
    const timeSlot = this.bookingForm.get('timeSlot')?.value;
    if (timeSlot) {
      workspaces = workspaces.filter(w => w.isAvailable === true);
    }

    return workspaces;
  }

  private generateTimeSlotsForDuration(duration: string, date: Date): void {
    const slots: { startTime: string; endTime: string }[] = [];
    const startHour = 8;
    const endHour = 19;
    const durationMinutes = this.getDurationInMinutes(duration);
    if (!durationMinutes) { this.state.availableTimeSlots = []; return; }

    const today = new Date();
    const isToday = this.isSameDay(date, today);
    const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();

    if (this.isFullDay(duration)) {
      if (!isToday || (8 * 60) > (currentTimeInMinutes + 30)) slots.push({ startTime: '08:00', endTime: '17:00' });
      if (!isToday || (9 * 60) > (currentTimeInMinutes + 30)) slots.push({ startTime: '09:00', endTime: '18:00' });
      if (!isToday || (10 * 60) > (currentTimeInMinutes + 30)) slots.push({ startTime: '10:00', endTime: '19:00' });
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
          map(availableSlots => {
            // Robust check: ensure ALL 30-min intervals within the slot are available
            const normalize = (time: string) => (time || '').replace(/\s/g, '').replace(/^0/, '');
            
            // Helper to convert "HH:mm" to total minutes
            const toMinutes = (t: string) => {
              const [h, m] = t.split(':').map(Number);
              return h * 60 + m;
            };

            const startMinutes = toMinutes(startTime);
            const endMinutes = toMinutes(endTime);
            
            // Generate all 30-min interval starts within the selected slot
            const requiredIntervals: string[] = [];
            for (let m = startMinutes; m < endMinutes; m += 30) {
              const hStr = Math.floor(m / 60).toString().padStart(2, '0');
              const mStr = (m % 60).toString().padStart(2, '0');
              requiredIntervals.push(`${hStr}:${mStr}`);
            }

            const normalizedAvailable = (availableSlots || []).map(normalize);
            
            // A workspace is available ONLY if every required interval is in the available list
            const isAvailable = requiredIntervals.length > 0 && requiredIntervals.every(interval => 
              normalizedAvailable.includes(normalize(interval))
            );

            return {
              ...workspace,
              isAvailable: isAvailable
            };
          }),
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

        // Se la postazione selezionata non è più disponibile col nuovo orario, resetta la selezione
        const currentWorkspaceId = this.bookingForm.get('workspaceId')?.value;
        if (currentWorkspaceId) {
          const selected = workspaces.find(w => w.id === Number(currentWorkspaceId));
          if (selected && !selected.isAvailable) {
            this.bookingForm.patchValue({ workspaceId: "", roomId: null });
            this.toastService.showInfo(
              this.translate.instant('COMMON.INFO'), 
              this.translate.instant('BOOKING.WORKSPACE.NOT_AVAILABLE')
            );
          }
        }
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
    
    // Set workspaceId - the subscription will handle roomId and roomType sync
    this.bookingForm.patchValue({ 
      workspaceId: String(workspaceId)
    });
    
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
          this.toastService.showSuccess(
            this.translate.instant('BOOKING.MESSAGES.CREATE_SUCCESS_TITLE'), 
            this.translate.instant('BOOKING.MESSAGES.CREATE_SUCCESS_DESC')
          );
          this.resetForm();
          this.loadMyReservations();
          this.state.isLoading = false;
        },
        error: (err) => {
          this.toastService.showError(
            this.translate.instant('BOOKING.MESSAGES.CREATE_ERROR_TITLE'), 
            err.message || this.translate.instant('BOOKING.MESSAGES.CREATE_ERROR_DESC')
          );
          this.state.isLoading = false;
        }
      });
    }
  }

  private resetForm(): void {
    this.bookingForm.reset({ roomType: "" });
    this.state.selectedDates = [];
    this.state.availableTimeSlots = [];
    
    // Re-initialize availableWorkspaces from rooms instead of clearing it
    // This keeps the map populated for the "standard" view and future selections
    this.state.availableWorkspaces = this.state.rooms.flatMap(room => 
      (room.workspaces || [])
        .filter(w => w.mapX != null && w.mapY != null && (w.mapX > 0 || w.mapY > 0))
        .map(w => ({
          ...w,
          roomId: room.id!,
          roomName: room.name!,
          roomType: room.roomType!,
          isAvailable: undefined
        }))
    );

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
        this.toastService.showError(
          this.translate.instant('BOOKING.MESSAGES.CREATE_ERROR_TITLE'), 
          this.translate.instant('RESERVATIONS.MESSAGES.LOADING_ERROR')
        );
        this.state.isLoading = false;
      }
    });
  }

  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  formatDate(date: any, format: string): string {
    const d = new Date(date);
    const lang = this.translate.currentLang === 'en' ? 'en-US' : 'it-IT';
    return this.isValidDate(d) ? this.datePipe.transform(d, format, undefined, lang)! : 'Invalid Date';
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

  onLocationChange(): void {
    this.resetForm();
    this.toastService.showInfo('Sede Cambiata', `Hai selezionato la sede di ${this.selectedLocation}`);
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  private checkUserRole(): void {
    this.authService.getIdentity().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAdmin = user?.badges?.includes('ROLE_ADMIN') || false;
      if (this.isAdmin) this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.adminService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => { this.users = users; this.filteredUsers = users; },
      error: () => this.toastService.showError(
        this.translate.instant('BOOKING.MESSAGES.LOADING_ERROR_TITLE'), 
        this.translate.instant('USER_MANAGEMENT.MESSAGES.ERROR_LOAD')
      )
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

  canCancelReservation(r: Reservation): boolean {
    return r.status !== ReservationStatus.DENIED && new Date(r.endDate) > new Date();
  }

  cancelReservation(r: Reservation): void {
    this.reservationsToCancel = [r];
    this.showBulkCancelConfirmation = true;
  }

  bulkCancelReservations(): void {
    this.reservationsToCancel = this.reservations.filter(r => this.selectedReservations.has(r.id!));
    this.showBulkCancelConfirmation = true;
  }

  confirmBulkCancel(): void {
    const requests = this.reservationsToCancel.map(r => this.reservationService.deleteReservation(r.id!));
    this.state.isLoading = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.translate.instant('BOOKING.MESSAGES.CREATE_SUCCESS_TITLE'), 
          this.translate.instant('BOOKING.MESSAGES.CANCEL_SUCCESS')
        );
        this.loadMyReservations();
        this.selectedReservations.clear();
        this.isSelectAllChecked = false;
        this.closeBulkCancelConfirmation();
      },
      error: () => {
        this.toastService.showError(
          this.translate.instant('BOOKING.MESSAGES.CREATE_ERROR_TITLE'), 
          this.translate.instant('BOOKING.MESSAGES.CANCEL_ERROR')
        );
        this.state.isLoading = false;
      }
    });
  }

  closeBulkCancelConfirmation(): void { this.showBulkCancelConfirmation = false; this.reservationsToCancel = []; }

  toggleSelectAll(): void {
    if (this.isSelectAllChecked) this.selectedReservations.clear();
    else this.reservations.filter(r => this.canCancelReservation(r)).forEach(r => this.selectedReservations.add(r.id!));
    this.isSelectAllChecked = !this.isSelectAllChecked;
  }

  toggleSelectReservation(id: number): void {
    if (this.selectedReservations.has(id)) { this.selectedReservations.delete(id); this.isSelectAllChecked = false; }
    else { this.selectedReservations.add(id); this.isSelectAllChecked = this.selectedReservations.size === this.reservations.filter(r => this.canCancelReservation(r)).length; }
  }

  isReservationSelected(id: number): boolean { return this.selectedReservations.has(id); }

  getActiveReservations(): Reservation[] {
    const now = new Date();
    return this.reservations.filter(r => r.status === ReservationStatus.CONFIRMED && new Date(r.endDate) > now);
  }

  canShowCheckbox(r: Reservation): boolean { return this.canCancelReservation(r); }

  getSelectedCount(): number { return this.selectedReservations.size; }
}
