import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AdminService } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './role-selector.component.html',
  styleUrl: './role-selector.component.css'
})
export class RoleSelectorComponent implements OnInit {
  @Input() assignedRoles: string[] = [];
  @Output() rolesChanged = new EventEmitter<string[]>();

  allAvailableRoles: any[] = [];
  availableRoles: any[] = [];
  assignedRolesList: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    // Carichiamo i ruoli dal backend dinamicamente
    this.adminService.getbadges().subscribe({
      next: (badges) => {
        console.log("Ruoli ricevuti dal backend:", badges);
        
        this.allAvailableRoles = badges.map(auth => {
          // Usiamo uno stile uniforme per tutti i ruoli dinamici
          let icon = 'fa-user-tag';
          let color = 'text-gray-700';
          let bg = 'bg-gray-100';
          
          // Formatta il nome rimuovendo "ROLE_", sostituendo i trattini bassi con spazi
          // e mettendo l'iniziale maiuscola (es. "ROLE_PLANIMETRY_MANAGER" -> "Planimetry Manager")
          let rawName = auth.name.replace(/^ROLE_/, '').replace(/_/g, ' ');
          let label = rawName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

          return {
            id: auth.name,
            label: label,
            icon: icon,
            color: color,
            bg: bg,
            isActive: auth.is_active
          };
        });

        // Filtriamo solo quelli attivi nel sistema (fallback se is_active non esiste)
        const activeRoles = this.allAvailableRoles.filter(role => role.isActive !== false);

        console.log("Ruoli considerati attivi:", activeRoles);

        this.assignedRolesList = activeRoles.filter(role => 
          this.assignedRoles.includes(role.id)
        );
        
        this.availableRoles = activeRoles.filter(role => 
          !this.assignedRoles.includes(role.id)
        );
      },
      error: (err) => {
        console.error('ERRORE GRAVE nel caricamento dei ruoli:', err);
      }
    });
  }

  // Funzione chiamata quando trascini un elemento
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Avvisiamo il form principale del cambiamento
    this.rolesChanged.emit(this.assignedRolesList.map(r => r.id));
  }
}
