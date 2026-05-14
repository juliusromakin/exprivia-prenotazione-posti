import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule
} from 'lucide-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LocationService } from '../../../core/services/location.service';
import { PlanimetriaService, FloorDTO, FloorPlanSummaryDTO } from '../../../core/services/planimetria.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationModalComponent, ConfirmationModalData } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

interface Edificio {
  id?: number;
  name: string;
  address: string;
  numFloors: number;
  coordX: number;
  coordY: number;
  locationId?: number;
  enabled?: boolean;
  sedeName?: string;
  planimetrie?: FloorPlanSummaryDTO[];
}

interface Sede {
  id?: number;
  name: string;
  city: string;
  enabled: boolean;
  phoneNumber?: string;
  email?: string;
  edifici: Edificio[];
}

@Component({
  selector: 'app-gestione-sedi',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    ToastModule,
    ConfirmationModalComponent
  ],
  providers: [
    MessageService
  ],
  templateUrl: './gestione-sedi.component.html',
  styleUrls: ['./gestione-sedi.component.css', '../../../shared/styles/toast.styles.css']
})
export class GestioneSediComponent implements OnInit {
  locations: Sede[] = [];
  loading = false;
  showModal = false;
  showBuildingModal = false;
  showPlanimetriaModal = false;
  isEditing = false;
  selectedFloor: number | null = null;
  selectedBuilding: Edificio | null = null;

  selectedLocationId?: number;
  selectedBuildingId?: number;
  selectedBuildingLocationId?: number;

  locationForm: FormGroup;
  buildingForm: FormGroup;
  formSubmitted = false;
  buildingFormSubmitted = false;

  currentView: 'tutti' | 'sede' = 'tutti';
  predefinedCitta = ['Roma', 'Molfetta', 'Milano'];
  expandedRowIndex: number | null = null;
  activeMenuIndex: number | null = null;

  // Deletion Modal Properties
  showDeleteConfirmation = false;
  deleteConfirmationData: ConfirmationModalData = {
    title: '',
    message: '',
    confirmButtonText: ''
  };
  itemToDelete: { type: 'location' | 'building' | 'planimetria', data: any } | null = null;
  isDeleting = false;

  toggleActionMenu(index: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  toggleFloorStatus(plan: any): void {
    const newStatus = !plan.isActive;
    this.planimetriaService.toggleFloorPlanStatus(plan.id).subscribe({
      next: () => {
        this.activeMenuIndex = null;
        if (this.selectedBuilding && this.selectedFloor) {
          const buildingCopy = { ...this.selectedBuilding };
          this.openPlanimetriaModal(buildingCopy, this.selectedFloor);
        } else {
          plan.isActive = newStatus;
          this.cdr.detectChanges();
        }
        this.toastService.showSuccess('Successo', `Planimetria ${newStatus ? 'abilitata' : 'disabilitata'} correttamente`);
      },
      error: () => {
        this.toastService.showError('Errore', 'Impossibile aggiornare lo stato della planimetria');
      }
    });
  }

  deleteFloorPlan(plan: any): void {
    console.log('Delete floor plan:', plan);
    this.itemToDelete = { type: 'planimetria', data: plan };
    this.deleteConfirmationData = {
      title: this.translate.instant('GESTIONE_SEDI.MESSAGES.CONFIRM_DELETE_TITLE'),
      message: this.translate.instant('GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.CONFIRM_DELETE', { name: plan.name }),
      confirmButtonText: 'Elimina',
      icon: 'trash',
      type: 'danger'
    };
    this.showDeleteConfirmation = true;
    this.cdr.detectChanges();
  }

  onDeleteBuilding(event: Event, ed: Edificio): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.deleteBuilding(ed);
  }

  onDeleteLocation(event: Event, loc: Sede): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.deleteLocation(loc);
  }

  deleteLocation(loc: Sede): void {
    console.log('Delete location logic starting for:', loc);
    if (!loc.id) return;
    this.itemToDelete = { type: 'location', data: loc };
    this.deleteConfirmationData = {
      title: this.translate.instant('GESTIONE_SEDI.MESSAGES.CONFIRM_DELETE_TITLE'),
      message: this.translate.instant('GESTIONE_SEDI.MESSAGES.CONFIRM_DELETE_LOCATION', { name: loc.name }),
      confirmButtonText: 'Elimina',
      icon: 'trash',
      type: 'danger'
    };
    this.showDeleteConfirmation = true;
    this.cdr.detectChanges();
  }

  deleteBuilding(ed: Edificio): void {
    console.log('Delete building logic starting for:', ed);
    if (!ed.id) return;
    this.itemToDelete = { type: 'building', data: ed };
    this.deleteConfirmationData = {
      title: this.translate.instant('GESTIONE_SEDI.MESSAGES.CONFIRM_DELETE_TITLE'),
      message: this.translate.instant('GESTIONE_SEDI.MESSAGES.CONFIRM_DELETE_BUILDING', { name: ed.name }),
      confirmButtonText: 'Elimina',
      icon: 'trash',
      type: 'danger'
    };
    this.showDeleteConfirmation = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;

    const id = this.itemToDelete.data.id;
    const type = this.itemToDelete.type;

    this.isDeleting = true;

    if (type === 'location') {
      this.locationService.hardDeleteLocation(id).subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION'),
            this.translate.instant('GESTIONE_SEDI.MESSAGES.DELETE_SUCCESS')
          );
          this.expandedRowIndex = null;
          this.closeDeleteConfirmation();
          this.loadLocations();
        },
        error: (err) => {
          console.error('Error deleting location:', err);
          this.toastService.showError(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION'),
            err.error?.message || this.translate.instant('GESTIONE_SEDI.MESSAGES.DELETE_ERROR')
          );
          this.isDeleting = false;
        }
      });
    } else if (type === 'building') {
      this.locationService.hardDeleteBuilding(id).subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING'),
            this.translate.instant('GESTIONE_SEDI.MESSAGES.DELETE_SUCCESS')
          );
          this.expandedRowIndex = null;
          this.closeDeleteConfirmation();
          this.loadLocations();
        },
        error: (err) => {
          console.error('Error deleting building:', err);
          this.toastService.showError(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING'),
            err.error?.message || this.translate.instant('GESTIONE_SEDI.MESSAGES.DELETE_ERROR')
          );
          this.isDeleting = false;
        }
      });
    } else if (type === 'planimetria') {
      this.planimetriaService.deleteFloorPlan(id).subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.SUCCESS_TITLE'),
            this.translate.instant('GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.DELETE_SUCCESS')
          );
          this.activeMenuIndex = null;
          this.closeDeleteConfirmation();

          if (this.selectedBuilding && this.selectedFloor) {
            this.openPlanimetriaModal(this.selectedBuilding, this.selectedFloor);
          }
          this.loadLocations();
        },
        error: (err) => {
          console.error('Error deleting planimetria:', err);
          this.toastService.showError(
            this.translate.instant('COMMON.ERROR'),
            err.error?.message || 'Errore durante l\'eliminazione della planimetria'
          );
          this.isDeleting = false;
        }
      });
    }
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.itemToDelete = null;
    this.isDeleting = false;
  }

  isFutureDate(date: Date | string | undefined | null): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d > new Date();
  }

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private translate: TranslateService,
    private locationService: LocationService,
    private planimetriaService: PlanimetriaService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      enabled: [true],
      addBuildings: [false],
      buildings: this.fb.array([])
    });

    this.buildingForm = this.fb.group({
      name: ['', Validators.required],
      numFloors: [1, [Validators.required, Validators.min(1)]],
      address: ['', Validators.required],
      coordX: [0, Validators.required],
      coordY: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.locationService.getAllLocations().subscribe({
      next: (data: any[]) => {
        this.locations = data.map(item => ({
          ...item,
          enabled: item.enabled ?? true,
          edifici: item.edifici || []
        }));
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Errore', 'Impossibile caricare le sedi dal server');
        this.loading = false;
      }
    });
  }

  get displayRows(): any[] {
    if (this.currentView === 'tutti') {
      const rows: any[] = [];
      this.locations.forEach(loc => {
        if (loc.edifici && loc.edifici.length > 0) {
          loc.edifici.forEach(ed => {
            rows.push({
              via: ed.address,
              sedeName: loc.name,
              city: loc.city,
              nPiani: ed.numFloors,
              enabled: loc.enabled,
              originalEdificio: { ...ed, locationId: loc.id, sedeName: loc.name }, // Riferimento per edit edificio
              originalLoc: loc      // Riferimento per fallback
            });
          });
        } else {
          // Aggiunge una riga per la sede anche se non ha edifici
          rows.push({
            via: '-', 
            sedeName: loc.name,
            city: loc.city,
            nPiani: 0,
            enabled: loc.enabled,
            originalEdificio: null,
            originalLoc: loc
          });
        }
      });
      return rows;
    } else {
      return this.locations.map(loc => ({
        sedeName: loc.name,
        city: loc.city,
        edificiCount: loc.edifici ? loc.edifici.length : 0,
        enabled: loc.enabled,
        originalLoc: loc
      }));
    }
  }

  setView(view: 'tutti' | 'sede'): void {
    this.currentView = view;
    this.expandedRowIndex = null;
  }

  toggleRow(index: number): void {
    this.expandedRowIndex = this.expandedRowIndex === index ? null : index;
  }

  getFloorsArray(num: number): number[] {
    return Array.from({ length: num }, (_, i) => i + 1);
  }

  openPlanimetriaModal(building: Edificio, floor: number): void {
    this.selectedBuilding = { ...building };
    this.selectedFloor = floor;
    this.showPlanimetriaModal = true;
    this.cdr.detectChanges();

    // Carica i piani dell'edificio per trovare il vero floorId
    if (building.id) {
      this.planimetriaService.getFloorsByEdificio(building.id).subscribe({
        next: (floors: FloorDTO[]) => {
          // Trova il piano corrispondente all'indice (es. 1° piano -> index 0 se creati in ordine, 
          // o cerchiamo per nome "Piano 1")
          const targetFloor = floors.find(f => f.name === `Piano ${floor}`) || floors[floor - 1];
          if (targetFloor && targetFloor.id) {
            this.planimetriaService.getFloorPlans(targetFloor.id).subscribe({
              next: (plans: FloorPlanSummaryDTO[]) => {
                if (this.selectedBuilding) {
                  this.selectedBuilding.planimetrie = plans;
                  this.cdr.detectChanges();
                }
              }
            });
          } else {
            if (this.selectedBuilding) {
              this.selectedBuilding.planimetrie = [];
              this.cdr.detectChanges();
            }
          }
        }
      });
    }
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  get buildingsArray(): FormArray {
    return this.locationForm.get('buildings') as FormArray;
  }

  addBuildingRow(data?: Edificio): void {
    const buildingGroup = this.fb.group({
      id: [data?.id || null],
      name: [data?.name || '', Validators.required],
      numFloors: [data?.numFloors || 1, [Validators.required, Validators.min(1)]],
      address: [data?.address || '', Validators.required],
      locationId: [this.selectedLocationId || data?.locationId || null],
      coordX: [data?.coordX || 0, Validators.required],
      coordY: [data?.coordY || 0, Validators.required]
    });
    this.buildingsArray.push(buildingGroup);
  }

  removeBuildingRow(index: number): void {
    this.buildingsArray.removeAt(index);
  }

  openNewLocationModal(): void {
    this.isEditing = false;
    this.selectedLocationId = undefined;
    this.formSubmitted = false;
    this.locationForm.reset({ enabled: true, addBuildings: false });
    this.buildingsArray.clear();
    this.showModal = true;
  }

  editLocation(loc: Sede): void {
    this.isEditing = true;
    this.selectedLocationId = loc.id;
    this.formSubmitted = false;
    this.showModal = true;
    this.locationForm.patchValue({
      name: loc.name,
      city: loc.city,
      phoneNumber: loc.phoneNumber || '',
      email: loc.email || '',
      enabled: loc.enabled,
      addBuildings: loc.edifici && loc.edifici.length > 0
    });
    this.buildingsArray.clear();
    if (loc.edifici) {
      loc.edifici.forEach(ed => this.addBuildingRow(ed));
    }
  }

  editBuilding(ed: Edificio): void {
    this.showBuildingModal = true;
    this.buildingFormSubmitted = false;
    this.selectedBuildingId = ed.id;
    this.selectedBuildingLocationId = ed.locationId;
    this.buildingForm.patchValue({
      name: ed.name,
      numFloors: ed.numFloors,
      address: ed.address,
      coordX: ed.coordX,
      coordY: ed.coordY
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.showBuildingModal = false;
  }

  saveLocation(): void {
    this.formSubmitted = true;
    if (this.locationForm.invalid) {
      console.log('Save blocked: Location form is invalid', this.locationForm.value);
      this.locationForm.markAllAsTouched();
      this.toastService.showError(
        'Attenzione',
        'Alcuni campi sono mancanti o contengono errori (es. email non valida). Controlla i riquadri rossi.'
      );
      return;
    }

    const formValue = this.locationForm.value;
    console.log('Form values:', formValue);

    // Clean edifici array: remove id if null (for new buildings)
    // and ensure locationId is present (even if 0) for backend validation
    const cleanedEdifici = (formValue.addBuildings ? formValue.buildings : []).map((ed: any) => {
      const { id, ...rest } = ed;
      const buildingData = {
        ...rest,
        locationId: ed.locationId || this.selectedLocationId || 0
      };
      return id ? { ...buildingData, id } : buildingData;
    });

    const payload: any = {
      name: formValue.name,
      city: formValue.city ? formValue.city.toUpperCase() : null,
      phoneNumber: formValue.phoneNumber,
      email: formValue.email,
      enabled: formValue.enabled,
      edifici: cleanedEdifici
    };

    console.log('Final Payload:', payload);
    // alert('DEBUG: Invio payload al server: ' + JSON.stringify(payload));

    this.loading = true;
    if (this.isEditing && this.selectedLocationId) {
      payload.id = this.selectedLocationId;
      this.locationService.updateLocation(this.selectedLocationId, payload).subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION'),
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION_SAVED')
          );
          this.showModal = false;
          this.loadLocations();
        },
        error: (err) => {
          console.error('Error updating location:', err);
          alert('ERRORE SERVER (UPDATE): ' + (err.error?.message || err.message || 'Errore sconosciuto'));
          this.toastService.showError(
            this.translate.instant('COMMON.ERROR'),
            err.error?.message || 'Errore durante il salvataggio della sede'
          );
          this.loading = false;
        }
      });
    } else {
      this.locationService.createLocation(payload).subscribe({
        next: () => {
          this.toastService.showSuccess(
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION'),
            this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION_SAVED')
          );
          this.showModal = false;
          this.loadLocations();
        },
        error: (err) => {
          console.error('Error creating location:', err);
          this.toastService.showError(
            this.translate.instant('COMMON.ERROR'),
            err.error?.message || 'Errore durante la creazione della sede'
          );
          this.loading = false;
        }
      });
    }
  }

  saveBuilding(): void {
    this.buildingFormSubmitted = true;
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      this.toastService.showError(
        'Attenzione',
        'Compila tutti i campi obbligatori per l\'edificio.'
      );
      return;
    }

    if (!this.selectedBuildingId) return;

    const formValue = this.buildingForm.value;
    const payload: any = {
      id: this.selectedBuildingId,
      name: formValue.name,
      address: formValue.address,
      numFloors: formValue.numFloors,
      coordX: formValue.coordX,
      coordY: formValue.coordY,
      locationId: this.selectedBuildingLocationId
    };

    this.loading = true;
    this.locationService.updateBuilding(this.selectedBuildingId, payload).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING'),
          this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING_SAVED')
        );
        this.showBuildingModal = false;
        this.loadLocations();
      },
      error: () => {
        this.toastService.showError('Errore', 'Errore durante l\'aggiornamento dell\'edificio');
        this.loading = false;
      }
    });
  }

  goToPlanimetriaManagement(planId?: number): void {
    if (this.selectedBuilding && this.selectedFloor) {
      this.router.navigate(['/amministrazione-planimetrie'], {
        queryParams: {
          locationId: this.selectedBuilding.locationId,
          buildingId: this.selectedBuilding.id,
          floor: this.selectedFloor,
          locationName: this.selectedBuilding.sedeName,
          buildingName: this.selectedBuilding.name,
          planId: planId
        }
      });
    } else {
      this.router.navigate(['/amministrazione-planimetrie']);
    }
  }

  goToBookings(): void {
    this.router.navigate(['/dashboard/workspace-booking']);
  }
}
