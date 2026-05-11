// frontend/src/app/core/services/planimetria.service.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosService } from './axios.service';

/** Rappresenta una Planimetria (corrispondente a un Floor nel backend). */
export interface Planimetria {
    id?: number;
    name?: string;
    buildingId?: number;
    enabled?: boolean;
    imagePath?: string;
    validFrom?: string | null;   // formato YYYY-MM-DD (LocalDate)
    validTo?: string | null;     // formato YYYY-MM-DD (LocalDate), null = fine indeterminata
    canvasWidth?: number;
    canvasHeight?: number;
    rooms?: any[];
    workspaces?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class PlanimetriaService {
    private readonly baseUrl = '/api/admin/floors';

    constructor(private axiosService: AxiosService) {}

    /** Recupera tutte le planimetrie di un edificio (buildingId). */
    getPlanimetrieByEdificio(buildingId: number, enabledOnly = false): Observable<Planimetria[]> {
        return from(
            this.axiosService.get<Planimetria[]>(
                `${this.baseUrl}/building/${buildingId}`,
                { params: { enabledOnly } }
            )
        );
    }

    /** Recupera i dettagli completi di una planimetria (incluse stanze e postazioni). */
    getPlanimetria(id: number): Observable<Planimetria> {
        return from(this.axiosService.get<Planimetria>(`${this.baseUrl}/${id}/planimetry`));
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
