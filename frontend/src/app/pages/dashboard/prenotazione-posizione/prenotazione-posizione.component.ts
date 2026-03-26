import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { CalendarComponent } from "@shared/components/calendar/calendar.component";
import { BookingState } from "./prenotazione-posizione.model";
import { Subject, takeUntil, firstValueFrom, forkJoin, of } from "rxjs";
import { Prenotazione, StatoPrenotazione } from "@core/models/prenotazione.model";
import { CosaDurata } from "@core/models/cosa-durata.model";
import { PrenotazionePosizioneService } from "./prenotazione-posizione.service";
import { Postazione } from "@/app/core/models/postazione.model";
import { Stanza, StanzaWithPostazioni } from "@core/models/stanza.model";
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '@core/models';
import { AdminService } from '@core/services/admin.service';
import { map, catchError } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    CalendarComponent, 
    ToastModule,
    ConfirmationModalComponent
  ],
  providers: [DatePipe],
  selector: "app-prenotazione-posizione",
  templateUrl: "./prenotazione-posizione.component.html",
  styleUrls: ['../../../shared/styles/toast.styles.css']
})
export class PrenotazionePosizioneComponent implements OnInit, OnDestroy {
  bookingForm: FormGroup;
  state: BookingState = {
    stanze: [],
    postazioniDisponibili: [],
    selectedDates: [],
    availableTimeSlots: [],
    isLoading: false,
    errorMessage: ""
  };

  tipiStanza: string[] = [];
  prenotazioni: Prenotazione[] = [];
  sortedPrenotazioni: Prenotazione[] = [];
  coseDurata: CosaDurata[] = [];
  private destroy$ = new Subject<void>();

  // Sorting properties
  sortColumn: string = 'data_inizio'; // Default sort by date
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
  selectedPrenotazioni: Set<number> = new Set();
  isSelectAllChecked: boolean = false;

  // Map duration label to minutes
  readonly durationMap: { [key: string]: number } = {
    'Giornata Intera': 600,
    '4h': 240,
    '2h': 120,
    '1h': 60,
    '30m': 30
  };

  // Add new properties for confirmation modal
  showBulkCancelConfirmation = false;
  prenotazioniToCancel: Prenotazione[] = [];

  // Add new properties for single cancellation modal
  showCancelConfirmation = false;
  prenotazioneToCancel: Prenotazione | null = null;

  get availableDurations(): string[] {
    if (!this.state.selectedDates || this.state.selectedDates.length === 0) {
      return [];
    }

    const durations = new Set<string>();
    
    // Controlla se la data selezionata è oggi per applicare filtri temporali
    const selectedDate = this.state.selectedDates[0];
    const today = new Date();
    const isToday = selectedDate && this.isSameDay(selectedDate, today);
    
    // Se è oggi, controlla se è ancora possibile prenotare certi orari
    if (isToday) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      // Controlla se la giornata intera è ancora possibile (08:00)
      if ((8 * 60) > (currentTimeInMinutes + 30)) {
        durations.add('Giornata Intera');
      }
      
      // Controlla le altre durate
      const checkDuration = (durationLabel: string, minutes: number) => {
        // Trova l'orario più tardi possibile per questa durata
        const latestStartHour = 18 - (minutes / 60);
        const latestStartMinutes = latestStartHour * 60;
        
        if (latestStartMinutes > (currentTimeInMinutes + 30)) {
          durations.add(durationLabel);
        }
      };
      
      checkDuration('4h', 240);
      checkDuration('2h', 120);
      checkDuration('1h', 60);
      checkDuration('30m', 30);
    } else {
      // Per le date future, tutte le durate sono disponibili
      durations.add('Giornata Intera');
      durations.add('4h');
      durations.add('2h');
      durations.add('1h');
      durations.add('30m');
    }

    return Array.from(durations);
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private prenotazionePosizioneService: PrenotazionePosizioneService,
    private toastService: ToastService,
    private datePipe: DatePipe,
    private adminService: AdminService
  ) {
    this.bookingForm = this.fb.group({
      userId: [''], // Campo opzionale per la selezione utente (solo admin)
      tipo_stanza: ["", Validators.required],
      id_stanza: [null, Validators.required],
      id_postazione: ["", Validators.required],
      slotDuration: ["", Validators.required],
      timeSlot: ["", Validators.required],
      selectedDate: [null, Validators.required],
      note: [""]
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadPrenotazioneInfo();
    this.setupFormSubscriptions();
    this.loadMiePrenotazioni(); // Carica tutte le prenotazioni all'avvio
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPrenotazioneInfo(): void {
    this.state.isLoading = true;
    this.prenotazionePosizioneService.getStanzeWithPostazioni()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { stanze: StanzaWithPostazioni[] }) => {
          this.state.stanze = response.stanze;
          this.tipiStanza = [...new Set(response.stanze.map((s: StanzaWithPostazioni) => s.tipo_stanza))].filter(Boolean) as string[];
          this.state.isLoading = false;
        },
        error: (err: Error) => {
          console.error('Errore nel caricamento delle informazioni:', err);
          this.state.errorMessage = "Errore nel caricamento delle informazioni";
          this.showErrorToast(
            'Errore di Caricamento', 
            'Impossibile caricare le informazioni delle stanze. Ricarica la pagina per riprovare.'
          );
          this.state.isLoading = false;
        }
      });
  }

  private setupFormSubscriptions(): void {
    // Log iniziale del form
    console.log('Stato iniziale del form:', {
      formValues: this.bookingForm.value,
      formValid: this.bookingForm.valid,
      formTouched: this.bookingForm.touched,
      formDirty: this.bookingForm.dirty
    });

    // Sottoscrizione a tutti i cambiamenti del form
    this.bookingForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        console.log('Form aggiornato:', {
          values,
          valid: this.bookingForm.valid,
          touched: this.bookingForm.touched,
          dirty: this.bookingForm.dirty,
          errors: this.bookingForm.errors,
          controls: {
            tipo_stanza: {
              value: this.bookingForm.get('tipo_stanza')?.value,
              valid: this.bookingForm.get('tipo_stanza')?.valid,
              errors: this.bookingForm.get('tipo_stanza')?.errors
            },
            slotDuration: {
              value: this.bookingForm.get('slotDuration')?.value,
              valid: this.bookingForm.get('slotDuration')?.valid,
              errors: this.bookingForm.get('slotDuration')?.errors
            },
            timeSlot: {
              value: this.bookingForm.get('timeSlot')?.value,
              valid: this.bookingForm.get('timeSlot')?.valid,
              errors: this.bookingForm.get('timeSlot')?.errors
            },
            id_postazione: {
              value: this.bookingForm.get('id_postazione')?.value,
              valid: this.bookingForm.get('id_postazione')?.valid,
              errors: this.bookingForm.get('id_postazione')?.errors
            }
          }
        });
      });

    this.bookingForm.get("tipo_stanza")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        console.log('Tipo stanza cambiato:', tipo);
        this.bookingForm.patchValue({
          id_stanza: null,
          id_postazione: "",
          slotDuration: "",
          timeSlot: ""
        });

        if (tipo) {
          console.log('Stanze disponibili:', this.state.stanze);
          const stanzeFiltrate = this.state.stanze.filter(s => s.tipo_stanza === tipo);
          console.log('Stanze filtrate per tipo:', stanzeFiltrate);

          // Generate base list of postazioni for this room type
          this.state.postazioniDisponibili = stanzeFiltrate
            .flatMap(stanza => {
              console.log('Elaborazione stanza:', stanza);
              return stanza.postazioni
                .filter(p => p.id_postazione !== undefined && p.nomePostazione !== undefined)
                .map((p: Postazione) => ({
                  id_postazione: p.id_postazione!,
                  nomePostazione: p.nomePostazione!,
                  stanza_id: stanza.id_stanza,
                  stanza_nome: stanza.nome,
                  tipo_stanza: stanza.tipo_stanza
                }));
            });
          console.log('Postazioni disponibili aggiornate:', this.state.postazioniDisponibili);
        } else {
          this.state.postazioniDisponibili = [];
        }
      });

    this.bookingForm.get("slotDuration")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(duration => {
        console.log('Durata slot cambiata:', duration);
        this.bookingForm.patchValue({
          timeSlot: "",
          id_postazione: ""
        });
        
        // Generate available time slots when duration is selected
        if (duration && this.state.selectedDates.length > 0) {
          this.loadAvailableTimeSlotsForDuration(duration);
          
          // If "Giornata Intera" is selected, automatically set the time slot and update postazioni availability
          if (duration === 'Giornata Intera') {
            this.bookingForm.patchValue({
              timeSlot: "08:00 - 18:00"
            });
            // Trigger postazioni availability check
            setTimeout(() => {
              this.updatePostazioniAvailability();
            }, 100);
          }
        } else {
          this.state.availableTimeSlots = [];
        }
      });

    this.bookingForm.get("timeSlot")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeSlot => {
        console.log('Time slot cambiato:', timeSlot);
        this.bookingForm.patchValue({
          id_postazione: ""
        });
        
        // When time slot is selected, update postazioni availability
        if (timeSlot && this.state.selectedDates.length > 0) {
          this.updatePostazioniAvailability();
        }
      });

    this.bookingForm.get("id_postazione")?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(postazioneId => {
        if (postazioneId) {
          // Find the selected postazione to get its stanza_id
          const selectedPostazione = this.state.postazioniDisponibili.find(p => p.id_postazione === Number(postazioneId));
          if (selectedPostazione) {
            // Set the associated stanza
            this.bookingForm.patchValue({
              id_stanza: selectedPostazione.stanza_id
            });
          }
        } else {
          // When postazione is deselected, reset related fields
          this.bookingForm.patchValue({
            id_stanza: null
          }, { emitEvent: false });
        }
      });
  }

  private loadAvailableTimeSlotsForDuration(duration: string): void {
    if (!this.state.selectedDates.length) {
      console.warn('Nessuna data selezionata');
      return;
    }

    const selectedDate = this.state.selectedDates[0];
    
    // Generate time slots based on duration without postazione dependency
    this.generateTimeSlotsForDuration(duration, selectedDate);
  }

  private generateTimeSlotsForDuration(duration: string, date: Date): void {
    const slots: { startTime: string; endTime: string }[] = [];
    const startHour = 8;
    const endHour = 18;
    
    // Map duration to minutes
    const durationMinutes = this.durationMap[duration];
    if (!durationMinutes) {
      this.state.availableTimeSlots = [];
      return;
    }

    // Check if today to filter past times
    const today = new Date();
    const isToday = this.isSameDay(date, today);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    if (duration === 'Giornata Intera') {
      // Only add full day if available
      if (!isToday || (8 * 60) > (currentTimeInMinutes + 30)) {
        slots.push({ startTime: '08:00', endTime: '18:00' });
      }
    } else {
      // Generate slots based on duration
      const step = durationMinutes >= 60 ? 60 : 30; // Step by 1 hour or 30 minutes
      
      for (let hour = startHour; hour < endHour; hour += step / 60) {
        const start = hour;
        const end = hour + durationMinutes / 60;
        
        if (end > endHour) continue;

        // Check if slot is in the future (for today)
        if (isToday) {
          const slotStartInMinutes = start * 60;
          if (slotStartInMinutes <= (currentTimeInMinutes + 30)) {
            continue;
          }
        }

        const startTime = `${Math.floor(start).toString().padStart(2, '0')}:${(start % 1 === 0.5 ? '30' : '00')}`;
        const endTime = `${Math.floor(end).toString().padStart(2, '0')}:${(end % 1 === 0.5 ? '30' : '00')}`;
        
        slots.push({ startTime, endTime });
      }
    }

    this.state.availableTimeSlots = slots;
    console.log('Generated time slots for duration:', { duration, slots });
  }

  private updatePostazioniAvailability(): void {
    const selectedTimeSlot = this.bookingForm.get('timeSlot')?.value;
    const selectedDate = this.state.selectedDates[0];
    const tipoStanza = this.bookingForm.get('tipo_stanza')?.value;
    
    if (!selectedTimeSlot || !selectedDate || !tipoStanza) {
      return;
    }

    console.log('Updating postazioni availability for:', { selectedTimeSlot, selectedDate, tipoStanza });

    // Parse time slot to get start and end times
    const [startTime, endTime] = selectedTimeSlot.split(' - ');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create start and end datetime objects
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Check availability for each postazione
    const availabilityChecks = this.state.postazioniDisponibili.map(postazione => 
      this.prenotazionePosizioneService.getAvailableTimeSlots(selectedDate, postazione.id_postazione)
        .pipe(
          map(availableSlots => {
            // Check if the selected time slot is available for this postazione
            const isAvailable = availableSlots.some(slot => 
              slot.startTime === startTime && slot.endTime === endTime
            );
            
            return {
              ...postazione,
              isAvailable
            };
          }),
          catchError(error => {
            console.error(`Error checking availability for postazione ${postazione.id_postazione}:`, error);
            return of({
              ...postazione,
              isAvailable: false
            });
          })
        )
    );

    // Execute all availability checks in parallel
    forkJoin(availabilityChecks)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (postazioniWithAvailability) => {
          // Sort: available first, then unavailable
          this.state.postazioniDisponibili = postazioniWithAvailability.sort((a, b) => {
            if (a.isAvailable && !b.isAvailable) return -1;
            if (!a.isAvailable && b.isAvailable) return 1;
            return a.nomePostazione.localeCompare(b.nomePostazione);
          });
          
          console.log('Updated postazioni with availability:', this.state.postazioniDisponibili);
        },
        error: (error) => {
          console.error('Error updating postazioni availability:', error);
          this.showErrorToast('Errore', 'Errore nel controllo della disponibilità delle postazioni');
        }
      });
  }

  onDateSelectionChange(dates: Date[]): void {
    console.log('Date selezionate:', dates);
    // Only allow one date
    const selected = dates && dates.length > 0 ? [dates[0]] : [];
    
    // Update the selected dates immediately for visual feedback
    this.state.selectedDates = [...selected];
    
    // Update the selectedDate form control immediately and reset dependent fields
    this.bookingForm.patchValue({
      selectedDate: selected.length > 0 ? selected[0] : null,
      slotDuration: "",
      timeSlot: "",
      id_postazione: ""
    });
    this.state.availableTimeSlots = [];
    
    // Clear postazioni availability when date changes
    this.state.postazioniDisponibili = this.state.postazioniDisponibili.map(p => ({
      ...p,
      isAvailable: undefined
    }));
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      const formData = this.bookingForm.value;
      const selectedDate = formData.selectedDate;
      const selectedTimeSlot = formData.timeSlot;

      if (!selectedTimeSlot) {
        this.showErrorToast('Selezione Incompleta', 'Seleziona un orario per completare la prenotazione');
        return;
      }

      this.state.isLoading = true;
      
      // Show info toast while processing
      this.showInfoToast('Elaborazione in corso', 'Stiamo creando la tua prenotazione...');

      try {
        // Create start and end dates
        const startDateTime = new Date(selectedDate);
        const endDateTime = new Date(selectedDate);

        // Support both '08:00 - 18:00' and 'Giornata Intera' as input
        let startHour, startMinute, endHour, endMinute;
        if (selectedTimeSlot === '08:00 - 18:00' || selectedTimeSlot === 'Giornata Intera') {
          startHour = '08'; startMinute = '00'; endHour = '18'; endMinute = '00';
        } else {
          [startHour, startMinute] = selectedTimeSlot.split(' - ')[0].split(':');
          [endHour, endMinute] = selectedTimeSlot.split(' - ')[1].split(':');
        }

        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

        // Format dates with seconds in local timezone
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        // Log the form data and selected values
        console.log('Form Data:', {
          raw: formData,
          selectedDate,
          selectedTimeSlot,
          startDateTime,
          endDateTime,
          formattedStart: formatDate(startDateTime),
          formattedEnd: formatDate(endDateTime)
        });

        const prenotazione = {
          id_postazione: parseInt(formData.id_postazione),
          id_stanza: parseInt(formData.id_stanza),
          data_inizio: formatDate(startDateTime),
          data_fine: formatDate(endDateTime)
        };

        // Validate the prenotazione object
        if (!prenotazione.id_postazione || !prenotazione.id_stanza) {
          throw new Error('ID postazione o ID stanza non validi');
        }

        if (!this.isValidDate(startDateTime) || !this.isValidDate(endDateTime)) {
          throw new Error('Date non valide');
        }

        console.log('Sending reservation request:', prenotazione);

        // Determine which service method to use based on admin status and user selection
        const userId = this.bookingForm.get('userId')?.value;
        const serviceCall = this.isAdmin && userId 
          ? this.prenotazionePosizioneService.createPrenotazioneAdmin({ ...prenotazione, id_user: parseInt(userId) })
          : this.prenotazionePosizioneService.createPrenotazione(prenotazione);

        serviceCall.subscribe({
            next: (response) => {
              console.log('Prenotazione creata:', response);
              this.clearAllToasts(); // Clear any existing toasts
              this.showSuccessToast(
                'Prenotazione Confermata!', 
                `La postazione è stata prenotata per ${this.formatDate(selectedDate, 'dd/MM/yyyy')} dalle ${selectedTimeSlot === '08:00 - 18:00' ? 'Giornata Intera' : selectedTimeSlot}`
              );
              
              // Reset form and reload data
              this.resetForm();
              this.loadMiePrenotazioni();
              
              // Force reload of available time slots for the current date and postazione
              const currentPostazioneId = this.bookingForm.get('id_postazione')?.value;
              if (currentPostazioneId && this.state.selectedDates.length > 0) {
                console.log('DEBUG: Reloading time slots after booking');
                // After booking, we need to refresh the postazioni availability
                this.updatePostazioniAvailability();
              }
              
              this.state.isLoading = false;
            },
            error: (error) => {
              console.error('Errore completo nella creazione della prenotazione:', error);
              this.clearAllToasts();
              this.showErrorToast(
                'Errore di Validazione', 
                error instanceof Error ? error.message : 'I dati inseriti non sono validi. Controlla i campi e riprova.'
              );
              this.state.isLoading = false;
            }
          });
      } catch (error) {
        console.error('Errore nella preparazione della prenotazione:', error);
        this.clearAllToasts();
        this.showErrorToast(
          'Errore di Validazione', 
          error instanceof Error ? error.message : 'I dati inseriti non sono validi. Controlla i campi e riprova.'
        );
        this.state.isLoading = false;
      }
    } else {
      const errors = [];
      if (!this.bookingForm.valid) errors.push('Compila tutti i campi richiesti');
      if (this.state.selectedDates.length === 0) errors.push('Seleziona una data');
      if (!this.bookingForm.get('timeSlot')?.value) errors.push('Seleziona un orario');

      this.showWarningToast('Campi Mancanti', errors.join(', '));
    }
  }
  

  private resetForm(): void {
    this.bookingForm.reset();
    this.state.selectedDates = [];
    this.state.availableTimeSlots = [];
    this.state.errorMessage = "";
    
    // Ensure tipo_stanza shows the default option instead of being null
    this.bookingForm.patchValue({
      tipo_stanza: ""
    });
    
    // Reset user selection for admin
    if (this.isAdmin) {
      this.clearUserSearch();
    }
  }

  getStanzaName(stanzaId: number | undefined): string {
    if (!stanzaId) return '';
    const stanza = this.state.stanze.find(s => s.id_stanza === stanzaId);
    return stanza ? stanza.nome : '';
  }

  isFormValid(): boolean {
    const formControls = this.bookingForm.controls;
    
    // Check individual required fields
    const hasTipoStanza = !!formControls['tipo_stanza'].value;
    const hasIdStanza = !!formControls['id_stanza'].value;
    const hasIdPostazione = !!formControls['id_postazione'].value;
    const hasSelectedDate = !!formControls['selectedDate'].value || this.state.selectedDates.length > 0;
    const hasTimeSlot = !!formControls['timeSlot'].value;

    // Debug logging
    /*console.log('Form Validation State:', {
      hasTipoStanza,
      hasIdStanza,
      hasIdPostazione,
      hasSelectedDate,
      hasTimeSlot,
      formValid: this.bookingForm.valid,
      formValues: this.bookingForm.value,
      formErrors: this.bookingForm.errors,
      timeSlotValue: formControls['timeSlot'].value,
      selectedDateValue: formControls['selectedDate'].value,
      selectedDates: this.state.selectedDates
    });*/

    // Check if all required form controls have values
    const hasRequiredFields = 
      hasTipoStanza &&
      hasIdStanza &&
      hasIdPostazione &&
      hasSelectedDate &&
      hasTimeSlot;

    // Check if the form is valid (this includes required field validation)
    const formValid = this.bookingForm.valid;

    return hasRequiredFields && formValid;
  }

  private loadAllPrenotazioni(): void {
    this.state.isLoading = true;
    this.prenotazionePosizioneService.getUserPrenotazioni()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prenotazioni: Prenotazione[]) => {
          console.log('=== DETTAGLIO PRENOTAZIONI ===');
          console.log('Numero totale prenotazioni:', prenotazioni.length);
          
          // Log dettagliato di ogni prenotazione
          prenotazioni.forEach((p, index) => {
            console.group(`Prenotazione #${index + 1}`);
            console.log('ID:', p.id_prenotazioni);
            console.log('Data Inizio (raw):', p.data_inizio);
            console.log('Data Fine (raw):', p.data_fine);
            console.log('Stato:', p.stato_prenotazione);
            console.log('Utente:', {
              id: p.users?.id_user,
              email: p.users?.email,
              nome: p.users?.nome,
              cognome: p.users?.cognome
            });
            console.log('Stanza:', {
              id: p.stanze?.id_stanza,
              nome: p.stanze?.nome
            });
            console.log('Postazione:', {
              id: p.postazione?.id_postazione,
              nome: p.postazione?.nomePostazione
            });
            console.groupEnd();
          });

          // Parse e formatta le date
          this.prenotazioni = prenotazioni.map(p => ({
            ...p,
            data_inizio: this.parseDate(p.data_inizio),
            data_fine: this.parseDate(p.data_fine),
            stato_prenotazione: p.stato_prenotazione || StatoPrenotazione.Confermata
          }));

          this.state.isLoading = false;
          console.log('=== PRENOTAZIONI DOPO PARSING ===');
          console.log(JSON.stringify(this.prenotazioni, null, 2));
        },
        error: (error: Error) => {
          console.error('Errore nel caricamento delle prenotazioni:', error);
          this.showErrorToast('Errore', 'Errore nel caricamento delle prenotazioni');
          this.state.isLoading = false;
        }
      });
  }

  private loadMiePrenotazioni(): void {
    this.state.isLoading = true;
    this.prenotazionePosizioneService.getUserPrenotazioni()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prenotazioni: Prenotazione[]) => {
          console.group('Prenotazioni Utente');
          console.log('Raw prenotazioni data:', prenotazioni);
          
          // Process the prenotazioni with the new simplified structure
          this.prenotazioni = prenotazioni.map(p => ({
            ...p,
            data_inizio: this.parseDate(p.data_inizio),
            data_fine: this.parseDate(p.data_fine),
            stato_prenotazione: p.stato_prenotazione || StatoPrenotazione.Confermata,
            users: {
              id_user: p.users?.id_user || 0,
              nome: p.users?.nome || 'N/A',
              cognome: p.users?.cognome || 'N/A',
              email: p.users?.email || 'N/A',
              enabled: p.users?.enabled || false
            },
            postazione: {
              id_postazione: p.postazione?.id_postazione || 0,
              nomePostazione: p.postazione?.nomePostazione || 'N/A'
            },
            stanze: {
              id_stanza: p.stanze?.id_stanza || 0,
              nome: p.stanze?.nome || 'N/A',
              tipo_stanza: p.stanze?.tipo_stanza || 'N/A'
            }
          }));

          console.log('Processed prenotazioni:', this.prenotazioni);
          console.groupEnd();
          
          // Apply sorting after loading data
          this.applySorting();
          this.state.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Errore nel caricamento delle prenotazioni:', error);
          this.showErrorToast('Errore', 'Errore nel caricamento delle prenotazioni');
          this.state.isLoading = false;
        }
      });
  }

  private parseDate(dateValue: any): Date {
    if (dateValue instanceof Date) {
      console.log('Value is already a Date');
      return dateValue;
    }
    
    if (Array.isArray(dateValue)) {
      try {
        // Array format: [year, month, day, hours, minutes, seconds, nanoseconds]
        const [year, month, day, hours, minutes] = dateValue;
        const date = new Date(year, month - 1, day, hours, minutes);
        return date;
      } catch (error) {
        console.error('Error parsing array date:', error);
        return new Date();
      }
    }
    
    if (typeof dateValue === 'string') {
      // Se è una stringa che contiene virgole, è un array di numeri
      if (dateValue.includes(',')) {
        try {
          const [year, month, day, hours, minutes] = dateValue.split(',').map(Number);
          const date = new Date(year, month - 1, day, hours, minutes);
          return date;
        } catch (error) {
          console.error('Error parsing comma-separated date:', error);
          return new Date();
        }
      }
      
      // Prova a parsare la stringa ISO
      try {
        const date = new Date(dateValue);
        return date;
      } catch (error) {
        console.error('Error parsing ISO date:', error);
        return new Date();
      }
    }
    
    console.error('Unknown date format:', dateValue);
    return new Date();
  }

  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  formatDate(date: any, format: string): string {
    if (!this.isValidDate(date)) {
      return 'Data non valida';
    }
    return this.datePipe.transform(date, format, '', 'it-IT') || 'Data non valida';
  }

  getFormattedTimeRange(dataInizio: any, dataFine: any): string {
    if (!this.isValidDate(dataInizio) || !this.isValidDate(dataFine)) {
      return 'Orario non valido';
    }
    const inizio = this.formatDate(dataInizio, 'HH:mm');
    const fine = this.formatDate(dataFine, 'HH:mm');
    return `${inizio} - ${fine}`;
  }

  isValidTimeSlot(): boolean {
    const selectedTimeSlot = this.bookingForm.get('timeSlot')?.value;
    return !!(selectedTimeSlot && selectedTimeSlot.start && selectedTimeSlot.end);
  }

  deletePrenotazione(prenotazione: Prenotazione): void {
    if (!prenotazione.id_prenotazioni) {
      this.showErrorToast('Errore di Sistema', 'Impossibile identificare la prenotazione da eliminare');
      return;
    }

    // Conferma eliminazione
    const dataFormatted = this.formatDate(prenotazione.data_inizio, 'dd/MM/yyyy');
    const orarioFormatted = this.getFormattedTimeRange(prenotazione.data_inizio, prenotazione.data_fine);
    const postazioneNome = prenotazione.postazione?.nomePostazione || 'N/A';
    
    const conferma = confirm(
      `Sei sicuro di voler eliminare la prenotazione?\n\n` +
      `📅 Data: ${dataFormatted}\n` +
      `⏰ Orario: ${orarioFormatted}\n` +
      `💺 Postazione: ${postazioneNome}\n\n` +
      `Questa azione non può essere annullata.`
    );

    if (!conferma) {
      return;
    }

    this.state.isLoading = true;
    
    // Show info toast while processing
    this.showInfoToast('Eliminazione in corso', 'Stiamo cancellando la tua prenotazione...');

    this.prenotazionePosizioneService.deletePrenotazione(prenotazione.id_prenotazioni)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearAllToasts(); // Clear any existing toasts
          this.showSuccessToast(
            'Prenotazione Cancellata', 
            `La prenotazione del ${dataFormatted} è stata eliminata con successo`
          );
          
          // Rimuovi la prenotazione dalla lista locale
          this.prenotazioni = this.prenotazioni.filter(p => p.id_prenotazioni !== prenotazione.id_prenotazioni);
          // Update sorted array as well
          this.applySorting();
          this.state.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Errore nell\'eliminazione della prenotazione:', error);
          this.clearAllToasts();
          
          let errorMessage = 'Si è verificato un errore durante l\'eliminazione della prenotazione';
          if (error.message?.includes('non trovata')) {
            errorMessage = 'La prenotazione non è più disponibile o è già stata eliminata';
          } else if (error.message?.includes('non autorizzato')) {
            errorMessage = 'Non hai i permessi per eliminare questa prenotazione';
          }
          
          this.showErrorToast('Errore nell\'Eliminazione', errorMessage);
          this.state.isLoading = false;
        }
      });
  }

  // Toast utility methods for consistent styling and messaging
  private showSuccessToast(summary: string, detail: string): void {
    this.toastService.showSuccess(summary, detail);
  }

  private showErrorToast(summary: string, detail: string): void {
    this.toastService.showError(summary, detail);
  }

  private showInfoToast(summary: string, detail: string): void {
    this.toastService.showInfo(summary, detail);
  }

  private showWarningToast(summary: string, detail: string): void {
    this.toastService.showWarning(summary, detail);
  }

  // Clear all existing toasts
  private clearAllToasts(): void {
    this.toastService.clear();
  }

  // Sorting methods
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.sortedPrenotazioni = this.filteredPrenotazioni.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'data_inizio':
          valueA = new Date(a.data_inizio);
          valueB = new Date(b.data_inizio);
          break;
        case 'utente':
          valueA = `${a.users?.nome || ''} ${a.users?.cognome || ''}`.trim().toLowerCase();
          valueB = `${b.users?.nome || ''} ${b.users?.cognome || ''}`.trim().toLowerCase();
          break;
        case 'stanza':
          valueA = (a.stanze?.nome || '').toLowerCase();
          valueB = (b.stanze?.nome || '').toLowerCase();
          break;
        case 'postazione':
          valueA = (a.postazione?.nomePostazione || '').toLowerCase();
          valueB = (b.postazione?.nomePostazione || '').toLowerCase();
          break;
        case 'stato':
          valueA = a.stato_prenotazione?.toLowerCase() || '';
          valueB = b.stato_prenotazione?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fas fa-sort text-gray-400';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up text-blue-600' : 'fas fa-sort-down text-blue-600';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column;
  }

  setStatusFilter(status: 'tutti' | 'attive' | 'scadute' | 'annullate'): void {
    this.statusFilter = status;
    this.applySorting();
  }

  getStatusFilterCount(status: 'tutti' | 'attive' | 'scadute' | 'annullate'): number {
    if (status === 'tutti') {
      return this.prenotazioni.length;
    }
    
    const now = new Date();
    return this.prenotazioni.filter(prenotazione => {
      switch (status) {
        case 'attive':
          return prenotazione.stato_prenotazione === 'Confermata' && 
                 prenotazione.data_fine > now;
        case 'scadute':
          return prenotazione.data_fine <= now;
        case 'annullate':
          return prenotazione.stato_prenotazione === 'Annullata';
        default:
          return true;
      }
    }).length;
  }

  get filteredPrenotazioni(): Prenotazione[] {
    if (this.statusFilter === 'tutti') {
      return this.prenotazioni;
    }
    
    const now = new Date();
    return this.prenotazioni.filter(prenotazione => {
      switch (this.statusFilter) {
        case 'attive':
          return prenotazione.stato_prenotazione === 'Confermata' && 
                 prenotazione.data_fine > now;
        case 'scadute':
          return prenotazione.data_fine <= now;
        case 'annullate':
          return prenotazione.stato_prenotazione === 'Annullata';
        default:
          return true;
      }
    });
  }

  // Add this new method to handle month changes
  onMonthChange(date: Date): void {
    console.log('Month changed to:', date);
    // No need to check availability anymore since we removed that functionality
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isTodaySelected(): boolean {
    if (this.state.selectedDates.length === 0) return false;
    const selectedDate = this.state.selectedDates[0];
    const today = new Date();
    return this.isSameDay(selectedDate, today);
  }

  // Admin and user management methods
  private checkUserRole(): void {
    this.authService.getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = user?.authorities?.includes('ROLE_ADMIN') || false;
        
        if (this.isAdmin) {
          this.loadUsers();
          // For admin, userId is optional (if empty, defaults to themselves)
          this.bookingForm.get('userId')?.clearValidators();
        } else {
          // For regular users, userId is not needed and should be hidden
          this.bookingForm.get('userId')?.clearValidators();
        }
        this.bookingForm.get('userId')?.updateValueAndValidity();
      });
  }

  private loadUsers(): void {
    if (!this.isAdmin) return;
    
    this.adminService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: User[]) => {
          this.users = users;
          this.filteredUsers = users;
        },
        error: (error: Error) => {
          console.error('Errore nel caricamento degli utenti:', error);
          this.showErrorToast('Errore', 'Impossibile caricare la lista degli utenti');
        }
      });
  }

  filterUsers(): void {
    if (!this.userSearchTerm) {
      this.filteredUsers = this.users;
      // Clear selected user when search is empty
      this.selectedUser = null;
      this.bookingForm.patchValue({ userId: '' });
      return;
    }

    const searchTerm = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.nome?.toLowerCase().includes(searchTerm) ||
      user.cognome?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      `${user.nome} ${user.cognome}`.toLowerCase().includes(searchTerm)
    );
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.userSearchTerm = `${user.nome} ${user.cognome}`;
    this.bookingForm.patchValue({ userId: user.id_user });
    this.showUserDropdown = false;
  }

  clearUserSearch(): void {
    this.userSearchTerm = '';
    this.selectedUser = null;
    this.bookingForm.patchValue({ userId: '' });
    this.filteredUsers = this.users;
    this.showUserDropdown = false;
  }

  onUserInputBlur(): void {
    // Delay hiding dropdown to allow click events
    setTimeout(() => {
      this.showUserDropdown = false;
    }, 200);
  }

  trackByUser(index: number, user: User): any {
    return user.id_user;
  }

  // Helper methods for cancel functionality
  canCancelPrenotazione(prenotazione: Prenotazione): boolean {
    // Cannot cancel if already canceled
    if (prenotazione.stato_prenotazione === StatoPrenotazione.Annullata) {
      return false;
    }
    
    // Cannot cancel if the booking has already passed
    const now = new Date();
    const bookingDate = new Date(prenotazione.data_fine);
    if (bookingDate <= now) {
      return false;
    }
    
    return true;
  }

  cancelPrenotazione(prenotazione: Prenotazione): void {
    if (!prenotazione.id_prenotazioni) {
      this.showErrorToast('Errore di Sistema', 'Impossibile identificare la prenotazione da annullare');
      return;
    }

    if (!this.canCancelPrenotazione(prenotazione)) {
      this.showWarningToast('Azione non consentita', 'Questa prenotazione non può essere annullata');
      return;
    }

    this.prenotazioniToCancel = [prenotazione];
    this.showBulkCancelConfirmation = true;
    document.body.classList.add('overflow-hidden');
  }

  bulkCancelPrenotazioni(): void {
    if (this.selectedPrenotazioni.size === 0) {
      this.showWarningToast('Nessuna Selezione', 'Seleziona almeno una prenotazione da annullare');
      return;
    }

    const selectedIds = Array.from(this.selectedPrenotazioni);
    this.prenotazioniToCancel = this.prenotazioni.filter(p => 
      p.id_prenotazioni && selectedIds.includes(p.id_prenotazioni)
    );

    this.showBulkCancelConfirmation = true;
    document.body.classList.add('overflow-hidden');
  }

  confirmBulkCancel(): void {
    const count = this.prenotazioniToCancel.length;
    this.state.isLoading = true;
    this.showInfoToast('Annullamento in corso', `Annullando ${count} ${count > 1 ? 'prenotazioni' : 'prenotazione'}...`);

    // Cancel all selected bookings in parallel
    const cancelRequests = this.prenotazioniToCancel.map(prenotazione =>
      this.prenotazionePosizioneService.updatePrenotazione(prenotazione.id_prenotazioni!, { 
        stato_prenotazione: StatoPrenotazione.Annullata 
      })
    );

    forkJoin(cancelRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearAllToasts();
          this.showSuccessToast(
            'Prenotazioni Annullate', 
            `${count} ${count > 1 ? 'prenotazioni annullate' : 'prenotazione annullata'} con successo`
          );
          
          // Update local bookings list
          this.prenotazioniToCancel.forEach(prenotazione => {
            const index = this.prenotazioni.findIndex(p => p.id_prenotazioni === prenotazione.id_prenotazioni);
            if (index !== -1) {
              this.prenotazioni[index] = {
                ...this.prenotazioni[index],
                stato_prenotazione: StatoPrenotazione.Annullata
              };
            }
          });
          
          // Clear selection and update sorted array
          this.selectedPrenotazioni.clear();
          this.isSelectAllChecked = false;
          this.applySorting();
          this.state.isLoading = false;
          this.closeBulkCancelConfirmation();
        },
        error: (error: Error) => {
          console.error('Errore nell\'annullamento delle prenotazioni:', error);
          this.clearAllToasts();
          this.showErrorToast('Errore nell\'Annullamento', 'Si è verificato un errore durante l\'annullamento delle prenotazioni selezionate');
          this.state.isLoading = false;
          this.closeBulkCancelConfirmation();
        }
      });
  }

  closeBulkCancelConfirmation(): void {
    this.showBulkCancelConfirmation = false;
    this.prenotazioniToCancel = [];
    document.body.classList.remove('overflow-hidden');
  }

  getBulkCancelConfirmationMessage(): string {
    if (this.prenotazioniToCancel.length === 0) {
      return 'Nessuna prenotazione selezionata';
    }

    const count = this.prenotazioniToCancel.length;
    const message = [
      `Sei sicuro di voler annullare ${count} ${count > 1 ? 'prenotazioni' : 'prenotazione'}?`,
      '',
      'Le seguenti prenotazioni verranno annullate:',
      ...this.prenotazioniToCancel.map(p => 
        `• ${this.formatDate(p.data_inizio, 'dd/MM/yyyy')} ` +
        `${this.getFormattedTimeRange(p.data_inizio, p.data_fine)} - ` +
        `${p.postazione.nomePostazione || 'N/A'}`
      ),
      '',
      'Questa azione non può essere annullata.'
    ];

    return message.join('<br>');
  }

  // Helper methods for template
  hasAvailablePostazioni(): boolean {
    return this.state.postazioniDisponibili.some(p => p.isAvailable === true);
  }

  hasUnavailablePostazioni(): boolean {
    return this.state.postazioniDisponibili.some(p => p.isAvailable === false);
  }

  getAvailablePostazioni(): any[] {
    return this.state.postazioniDisponibili.filter(p => p.isAvailable === true);
  }

  getUnavailablePostazioni(): any[] {
    return this.state.postazioniDisponibili.filter(p => p.isAvailable === false);
  }

  // Bulk selection methods
  toggleSelectAll(): void {
    if (this.isSelectAllChecked) {
      this.selectedPrenotazioni.clear();
    } else {
      this.prenotazioni
        .filter(p => this.canCancelPrenotazione(p))
        .forEach(p => p.id_prenotazioni && this.selectedPrenotazioni.add(p.id_prenotazioni));
    }
    this.isSelectAllChecked = !this.isSelectAllChecked;
  }

  toggleSelectPrenotazione(id: number): void {
    if (this.selectedPrenotazioni.has(id)) {
      this.selectedPrenotazioni.delete(id);
      this.isSelectAllChecked = false;
    } else {
      this.selectedPrenotazioni.add(id);
      this.isSelectAllChecked = this.selectedPrenotazioni.size === this.prenotazioni.filter(p => this.canCancelPrenotazione(p)).length;
    }
  }

  isPrenotazioneSelected(prenotazioneId: number): boolean {
    return this.selectedPrenotazioni.has(prenotazioneId);
  }

  getActivePrenotazioni(): Prenotazione[] {
    const now = new Date();
    return this.filteredPrenotazioni.filter(prenotazione => 
      prenotazione.stato_prenotazione === 'Confermata' && 
      prenotazione.data_fine > now
    );
  }

  canShowCheckbox(prenotazione: Prenotazione): boolean {
    return this.canCancelPrenotazione(prenotazione);
  }

  getSelectedCount(): number {
    return this.selectedPrenotazioni.size;
  }
}
