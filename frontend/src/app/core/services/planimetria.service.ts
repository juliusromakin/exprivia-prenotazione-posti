// frontend/src/app/core/services/planimetria.service.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AxiosService } from './axios.service';

export interface RoomPosition {
    id?: number;
    roomId: number;
    mapX: number;
    mapY: number;
    mapWidth: number;
    mapHeight: number;
}

export interface WorkspacePosition {
    id?: number;
    workspaceId: number;
    mapX: number;
    mapY: number;
}

export interface Planimetria {
    id?: number;
    floorId?: number;
    floorName?: string;
    name?: string;
    isActive?: boolean;
    validFrom?: string | null;
    validTo?: string | null;
    imagePath?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    rooms?: RoomPosition[];
    workspaces?: WorkspacePosition[];
}

export interface FloorDTO {
    id?: number;
    name?: string;
    buildingId?: number;
    enabled?: boolean;
    rooms?: any[];
    workspaces?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class PlanimetriaService {
    private readonly baseUrl = '/api/admin/floors';
    private readonly floorPlanUrl = '/api/admin/floor-plans';

    constructor(private axiosService: AxiosService) {}

    /** Recupera tutti i piani di un edificio. */
    getPlanimetrieByEdificio(buildingId: number, enabledOnly = false): Observable<FloorDTO[]> {
        return from(
            this.axiosService.get<FloorDTO[]>(
                `${this.baseUrl}/building/${buildingId}`,
                { params: { enabledOnly } }
            )
        );
    }

    /** Recupera tutti i FloorPlan (planimetrie) di un edificio, tutti i piani. */
    getAllPlansByBuilding(buildingId: number): Observable<Planimetria[]> {
        return from(this.axiosService.get<Planimetria[]>(`${this.floorPlanUrl}/building/${buildingId}/all`));
    }

    /** Recupera i dettagli completi di una planimetria (incluse stanze e postazioni). */
    getPlanimetria(floorId: number, date?: string): Observable<Planimetria> {
        return from(this.axiosService.get<Planimetria>(`${this.floorPlanUrl}/${floorId}/planimetry`, { params: date ? { date } : {} }));
    }

    /** Crea una nuova planimetria. */
    creaPlanimetria(planimetria: Planimetria): Observable<Planimetria> {
        return from(this.axiosService.post<Planimetria>(this.floorPlanUrl, planimetria));
    }

    /** Aggiorna una planimetria esistente. */
    aggiornaPlanimetria(id: number, planimetria: Planimetria): Observable<Planimetria> {
        return from(this.axiosService.put<Planimetria>(`${this.floorPlanUrl}/${id}`, planimetria));
    }

    /** Salva i dati di planimetria (stanze, postazioni, dimensioni canvas). */
    salvaDatiPlanimetria(planimetria: Planimetria): Observable<void> {
        return from(
            this.axiosService.post<void>(`${this.floorPlanUrl}/save`, planimetria)
        );
    }

    /** Upload dell'immagine PNG per una planimetria. */
    caricaImmaginePlanimetria(floorId: number, file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        return from(
            this.axiosService.post<string>(`${this.floorPlanUrl}/${floorId}/upload-planimetry`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            } as any)
        );
    }
    /** Attiva o disattiva un piano (planimetria). */
    toggleFloorStatus(id: number, enabled: boolean): Observable<void> {
        return from(this.axiosService.patch<void>(`${this.baseUrl}/${id}/status`, null, { params: { enabled } }));
    }
}
