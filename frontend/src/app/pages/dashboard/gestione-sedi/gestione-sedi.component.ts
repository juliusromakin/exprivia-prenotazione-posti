import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { 
  LucideAngularModule
} from 'lucide-angular';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface Edificio {
  name: string;
  address: string;
  numFloors: number;
  coordX: number;
  coordY: number;
  planimetrie?: { id: number, name: string, publishDate: Date }[];
}

interface Sede {
  id: number;
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
  locations: Sede[] = [
    {
      id: 1,
      name: 'Exprivia-Molfetta',
      city: 'Molfetta',
      enabled: true,
      phoneNumber: '080 123456',
      email: 'molfetta@exprivia.it',
      edifici: [
        { 
          name: 'Edificio 1', 
          address: 'Via Molfetta, 1', 
          numFloors: 3, 
          coordX: 10, 
          coordY: 10, 
          planimetrie: [
            { id: 1, name: 'Piano Terra - Standard', publishDate: new Date('2024-01-01') },
            { id: 2, name: 'Piano Terra - Expo 2024', publishDate: new Date('2024-10-15') }
          ] 
        },
        { 
          name: 'Edificio 2', 
          address: 'Via Molfetta, 2', 
          numFloors: 3, 
          coordX: 20, 
          coordY: 20, 
          planimetrie: [
            { id: 3, name: 'Area Uffici A', publishDate: new Date('2023-12-01') }
          ] 
        },
        { name: 'Edificio 3', address: 'Via Molfetta, 3', numFloors: 3, coordX: 30, coordY: 30, planimetrie: [] }
      ]
    },
    {
      id: 2,
      name: 'Exprivia-Bufalotta',
      city: 'Roma',
      enabled: true,
      phoneNumber: '06 987654',
      email: 'roma@exprivia.it',
      edifici: [
        { 
          name: 'Sede Roma 1', 
          address: 'Via Bufalotta, 104', 
          numFloors: 1, 
          coordX: 50, 
          coordY: 50, 
          planimetrie: [
            { id: 4, name: 'Layout Unico 2024', publishDate: new Date('2024-01-01') },
            { id: 5, name: 'Nuovo Layout 2025', publishDate: new Date('2025-01-01') }
          ] 
        },
        { 
          name: 'Sede Roma 2', 
          address: 'Via Tiburtina, 40', 
          numFloors: 5, 
          coordX: 60, 
          coordY: 60, 
          planimetrie: [
            { id: 6, name: 'Piano 1 - Attuale', publishDate: new Date('2024-02-01') },
            { id: 7, name: 'Piano 1 - Restyling Luglio', publishDate: new Date('2024-07-01') }
          ] 
        }
      ]
    }
  ];

  loading = false;
  showModal = false;
  showBuildingModal = false;
  showPlanimetriaModal = false;
  isEditing = false;
  selectedFloor: number | null = null;
  selectedBuilding: Edificio | null = null;

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
    private router: Router
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
  }

  get displayRows(): any[] {
    if (this.currentView === 'tutti') {
      const rows: any[] = [];
      this.locations.forEach(loc => {
        loc.edifici.forEach(ed => {
          rows.push({
            via: ed.address,
            sedeName: loc.name,
            city: loc.city,
            nPiani: ed.numFloors,
            enabled: loc.enabled,
            originalEdificio: ed, // Riferimento per edit edificio
            originalLoc: loc      // Riferimento per fallback
          });
        });
      });
      return rows;
    } else {
      return this.locations.map(loc => ({
        sedeName: loc.name,
        city: loc.city,
        edificiCount: loc.edifici.length,
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
    this.locationForm.reset({ enabled: true, addBuildings: false });
    this.buildingsArray.clear();
    this.showModal = true;
  }

  editLocation(loc: Sede): void {
    this.isEditing = true;
    this.showModal = true;
    this.locationForm.patchValue({
      name: loc.name,
      city: loc.city,
      phoneNumber: loc.phoneNumber || '',
      email: loc.email || '',
      enabled: loc.enabled,
      addBuildings: loc.edifici.length > 0
    });
    this.buildingsArray.clear();
    loc.edifici.forEach(ed => this.addBuildingRow(ed));
  }

  editBuilding(ed: Edificio): void {
    this.showBuildingModal = true;
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
    this.messageService.add({ severity: 'success', summary: 'Sede', detail: 'Modifiche salvate (Front-end)' });
    this.showModal = false;
  }

  saveBuilding(): void {
    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Edificio', detail: 'Dati edificio aggiornati (Front-end)' });
    this.showBuildingModal = false;
  }

  goToPlanimetriaManagement(): void {
    this.router.navigate(['/amministrazione-planimetrie']);
  }

  goToBookings(): void {
    this.router.navigate(['/dashboard/workspace-booking']);
  }
}
