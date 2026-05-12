// frontend/src/app/core/services/planimetria.service.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
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
        return from(this.axiosService.get<Planimetria[]>(`${this.baseUrl}/building/${buildingId}/planimetry/all`));
    }

    /** Recupera i dettagli completi di una planimetria (incluse stanze e postazioni). */
    getPlanimetria(id: number, date?: string): Observable<Planimetria> {
        return from(this.axiosService.get<Planimetria>(`${this.baseUrl}/${id}/planimetry`, { params: date ? { date } : {} }));
    }

    /** Crea una nuova planimetria. */
    creaPlanimetria(planimetria: Planimetria): Observable<Planimetria> {
        return from(this.axiosService.post<Planimetria>(this.baseUrl, planimetria));
    }

    /** Aggiorna una planimetria esistente. */
    aggiornaPlanimetria(id: number, planimetria: Planimetria): Observable<Planimetria> {
        return from(this.axiosService.put<Planimetria>(`${this.baseUrl}/${id}`, planimetria));
    }

    /** Salva i dati di planimetria (stanze, postazioni, dimensioni canvas). */
    salvaDatiPlanimetria(planimetria: Planimetria): Observable<void> {
        return from(
            this.axiosService.post<void>(`${this.baseUrl}/planimetry/save`, planimetria)
        );
    }

    /** Upload dell'immagine PNG per una planimetria. */
    caricaImmaginePlanimetria(id: number, file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        return from(
            this.axiosService.post<string>(`${this.baseUrl}/${id}/upload-planimetry`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            } as any)
        );
    }
}
