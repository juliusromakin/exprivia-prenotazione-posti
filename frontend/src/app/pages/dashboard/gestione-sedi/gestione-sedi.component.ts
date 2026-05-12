import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { 
  LucideAngularModule
} from 'lucide-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LocationService } from '../../../core/services';

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
  planimetrie?: { id: number, name: string, publishDate: Date }[];
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
    ToastModule
  ],
  providers: [
    MessageService
  ],
  templateUrl: './gestione-sedi.component.html',
  styleUrls: ['./gestione-sedi.component.css']
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

  currentView: 'tutti' | 'sede' = 'tutti';
  predefinedCitta = ['Roma', 'Molfetta', 'Milano'];
  expandedRowIndex: number | null = null;

  isFutureDate(date: Date): boolean {
    return date > new Date();
  }

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private translate: TranslateService,
    private locationService: LocationService
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      phoneNumber: [''],
      email: ['', [Validators.email]],
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
        this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile caricare le sedi dal server' });
        this.loading = false;
      }
    });
  }

  get displayRows(): any[] {
    if (this.currentView === 'tutti') {
      const rows: any[] = [];
      this.locations.forEach(loc => {
        if (loc.edifici) {
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
    this.selectedBuilding = building;
    this.selectedFloor = floor;
    this.showPlanimetriaModal = true;
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
    this.locationForm.reset({ enabled: true, addBuildings: false });
    this.buildingsArray.clear();
    this.showModal = true;
  }

  editLocation(loc: Sede): void {
    this.isEditing = true;
    this.selectedLocationId = loc.id;
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
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const formValue = this.locationForm.value;
    const payload: any = {
      name: formValue.name,
      city: formValue.city ? formValue.city.toUpperCase() : null,
      phoneNumber: formValue.phoneNumber,
      email: formValue.email,
      enabled: formValue.enabled,
      edifici: formValue.addBuildings ? formValue.buildings : []
    };

    this.loading = true;
    if (this.isEditing && this.selectedLocationId) {
      payload.id = this.selectedLocationId;
      this.locationService.updateLocation(this.selectedLocationId, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sede', detail: 'Sede aggiornata con successo' });
          this.showModal = false;
          this.loadLocations();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante il salvataggio della sede' });
          this.loading = false;
        }
      });
    } else {
      this.locationService.createLocation(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sede', detail: 'Sede creata con successo' });
          this.showModal = false;
          this.loadLocations();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante la creazione della sede' });
          this.loading = false;
        }
      });
    }
    this.messageService.add({ 
      severity: 'success', 
      summary: this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION'), 
      detail: this.translate.instant('GESTIONE_SEDI.MESSAGES.LOCATION_SAVED') 
    });
    this.showModal = false;
  }

  saveBuilding(): void {
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
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
        this.messageService.add({ severity: 'success', summary: 'Edificio', detail: 'Dati edificio aggiornati con successo' });
        this.showBuildingModal = false;
        this.loadLocations();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante l\'aggiornamento dell\'edificio' });
        this.loading = false;
      }
    });
    this.messageService.add({ 
      severity: 'success', 
      summary: this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING'), 
      detail: this.translate.instant('GESTIONE_SEDI.MESSAGES.BUILDING_SAVED') 
    });
    this.showBuildingModal = false;
  }

  goToPlanimetriaManagement(): void {
    if (this.selectedBuilding && this.selectedFloor) {
      this.router.navigate(['/amministrazione-planimetrie'], {
        queryParams: {
          locationId: this.selectedBuilding.locationId,
          buildingId: this.selectedBuilding.id,
          floor: this.selectedFloor,
          locationName: this.selectedBuilding.sedeName,
          buildingName: this.selectedBuilding.name
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
