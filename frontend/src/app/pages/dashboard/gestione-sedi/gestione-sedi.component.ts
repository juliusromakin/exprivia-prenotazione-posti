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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    ConfirmationModalComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [
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
  searchTerm = '';
  predefinedCitta = ['Roma', 'Molfetta', 'Milano'];
  expandedRowIndex: number | null = null;
  activeMenuIndex: number | null = null;

  isDeleting = false;

  // Deletion Modal Properties
  showDeleteConfirmation = false;
  deleteConfirmationData: ConfirmationModalData = {
    title: '',
    message: '',
    confirmButtonText: ''
  };
  itemToDelete: { type: 'location' | 'building' | 'planimetria', data: any } | null = null;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageOptions = [10, 25, 50, 100];
  pageNumbers: number[] = [];
  paginatedRows: any[] = [];
  private filteredRows: any[] = [];

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
        
        const statusKey = newStatus ? 'GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.ENABLED' : 'GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.DISABLED';
        this.toastService.showSuccess(
          this.translate.instant('COMMON.SUCCESS'),
          this.translate.instant(statusKey)
        );
      },
      error: (err) => {
        this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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

  // Edit Plan Details Properties
  showEditPlanModal = false;
  editingPlanId: number | null = null;
  editingPlanName = '';
  editingPlanValidFrom: Date | null = null;
  editingPlanValidTo: Date | null = null;
  editingPlanEndless = false;

  openEditPlanModal(plan: any): void {
    this.activeMenuIndex = null;
    this.editingPlanId = plan.id;
    this.editingPlanName = plan.name || '';
    this.editingPlanValidFrom = plan.validFrom ? new Date(plan.validFrom) : null;
    this.editingPlanValidTo = plan.validTo ? new Date(plan.validTo) : null;
    this.editingPlanEndless = !plan.validTo;
    this.showPlanimetriaModal = false;
    this.showEditPlanModal = true;
  }

  closeEditPlanModal(): void {
    this.showEditPlanModal = false;
    this.editingPlanId = null;
    if (this.selectedBuilding && this.selectedFloor) {
      this.showPlanimetriaModal = true;
    }
  }

  onEditPlanEndlessChange(): void {
    if (this.editingPlanEndless) {
        this.editingPlanValidTo = null;
    }
  }

  salvaDettagliPlan(): void {
    if (!this.editingPlanId) return;
    if (!this.editingPlanName || !this.editingPlanValidFrom) {
        this.toastService.showWarning(
            this.translate.instant('COMMON.ATTENTION'),
            this.translate.instant('GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.FILL_REQUIRED') || 'Compila tutti i campi obbligatori'
        );
        return;
    }

    const payload = {
        name: this.editingPlanName,
        validFrom: this.editingPlanValidFrom.toISOString().split('T')[0],
        validTo: this.editingPlanEndless || !this.editingPlanValidTo ? null : this.editingPlanValidTo.toISOString().split('T')[0]
    };

    this.planimetriaService.aggiornaDettagliPlanimetria(this.editingPlanId, payload).subscribe({
        next: () => {
            this.toastService.showSuccess(
                this.translate.instant('COMMON.SUCCESS'),
                this.translate.instant('GESTIONE_SEDI.PLANIMETRIA_MODAL.MESSAGES.UPDATE_SUCCESS') || 'Planimetria aggiornata'
            );
            this.closeEditPlanModal();
            if (this.selectedBuilding && this.selectedFloor) {
                const buildingCopy = { ...this.selectedBuilding };
                this.openPlanimetriaModal(buildingCopy, this.selectedFloor);
            }
        },
        error: (err) => {
            this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
        }
    });
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
          this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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
          this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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
          this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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
        this.applyFilters();
      },
      error: (err) => {
        this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let rows: any[] = [];
    if (this.currentView === 'tutti') {
      this.locations.forEach(loc => {
        if (loc.edifici && loc.edifici.length > 0) {
          loc.edifici.forEach(ed => {
            rows.push({
              via: ed.address,
              edificioName: ed.name,
              sedeName: loc.name,
              city: loc.city,
              nPiani: ed.numFloors,
              floorsArray: Array.from({ length: ed.numFloors }, (_, i) => i + 1),
              enabled: loc.enabled,
              originalEdificio: { ...ed, locationId: loc.id, sedeName: loc.name },
              originalLoc: loc
            });
          });
        }
      });
      rows = rows.filter(row => {
        if (!this.searchTerm.trim()) return true;
        const searchLower = this.searchTerm.toLowerCase();
        return (
          row.via?.toLowerCase().includes(searchLower) ||
          row.edificioName?.toLowerCase().includes(searchLower) ||
          row.sedeName?.toLowerCase().includes(searchLower) ||
          row.city?.toLowerCase().includes(searchLower)
        );
      });
    } else {
      rows = this.locations.map(loc => ({
        sedeName: loc.name,
        city: loc.city,
        edificiCount: loc.edifici ? loc.edifici.length : 0,
        enabled: loc.enabled,
        originalLoc: loc
      }));
      rows = rows.filter(row => {
        if (!this.searchTerm.trim()) return true;
        const searchLower = this.searchTerm.toLowerCase();
        return (
          row.sedeName?.toLowerCase().includes(searchLower) ||
          row.city?.toLowerCase().includes(searchLower)
        );
      });
    }
    this.filteredRows = rows;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredRows.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    this.paginatedRows = this.filteredRows.slice(startIndex, endIndex);
    this.generatePageNumbers();
    this.cdr.detectChanges();
  }

  generatePageNumbers(): void {
    const maxVisiblePages = 5;
    this.pageNumbers = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
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
    this.itemsPerPage = Number(newSize);
    this.currentPage = 1;
    this.updatePagination();
  }

  goToFirstPage(): void { this.onPageChange(1); }
  goToLastPage(): void { this.onPageChange(this.totalPages); }
  goToPreviousPage(): void { this.onPageChange(this.currentPage - 1); }
  goToNextPage(): void { this.onPageChange(this.currentPage + 1); }

  getStartIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }


  setView(view: 'tutti' | 'sede'): void {
    this.currentView = view;
    this.expandedRowIndex = null;
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleRow(index: number): void {
    this.expandedRowIndex = this.expandedRowIndex === index ? null : index;
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
                  this.selectedBuilding.planimetrie = plans.map(p => ({
                    ...p,
                    isFuture: this.isFutureDate(p.publishDate)
                  }));
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
      this.toastService.showWarning(
        this.translate.instant('COMMON.ATTENTION'),
        this.translate.instant('GESTIONE_SEDI.LOCATION_MODAL.FILL_REQUIRED')
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
          this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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
          this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
          this.loading = false;
        }
      });
    }
  }

  saveBuilding(): void {
    this.buildingFormSubmitted = true;
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      this.toastService.showWarning(
        this.translate.instant('COMMON.ATTENTION'),
        this.translate.instant('GESTIONE_SEDI.LOCATION_MODAL.FILL_REQUIRED')
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
      error: (err) => {
        this.toastService.handleError(err, this.translate.instant('COMMON.ERROR'));
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
