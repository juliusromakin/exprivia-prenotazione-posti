import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AxiosService } from './axios.service';

export interface EdificioDTO {
    id?: number;
    name?: string;
    address?: string;
    locationId?: number;
    coordX?: number;
    coordY?: number;
    numFloors?: number;
    enabled?: boolean;
}

export interface SedeDTO {
    id?: number;
    name?: string;
    city?: string;
    enabled?: boolean;
    phoneNumber?: string;
    email?: string;
    edifici?: EdificioDTO[];
}

export interface SelectOptionDTO {
    value: string | number;
    label: string;
}

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private readonly locationsUrl = '/api/admin/locations';
    private readonly buildingsUrl = '/api/admin/buildings';

    constructor(private axiosService: AxiosService) {}

    // --- LOCATIONS ---

    getAllLocations(enabledOnly = false): Observable<SedeDTO[]> {
        return from(this.axiosService.get<SedeDTO[]>(this.locationsUrl, { params: { enabledOnly } }));
    }

    getLocationOptions(): Observable<SelectOptionDTO[]> {
        return from(this.axiosService.get<SelectOptionDTO[]>(`${this.locationsUrl}/options`));
    }

    getLocationById(id: number): Observable<SedeDTO> {
        return from(this.axiosService.get<SedeDTO>(`${this.locationsUrl}/${id}`));
    }

    createLocation(location: SedeDTO): Observable<SedeDTO> {
        return from(this.axiosService.post<SedeDTO>(this.locationsUrl, location));
    }

    updateLocation(id: number, location: SedeDTO): Observable<SedeDTO> {
        return from(this.axiosService.put<SedeDTO>(`${this.locationsUrl}/${id}`, location));
    }

    softDeleteLocation(id: number): Observable<void> {
        return from(this.axiosService.delete<void>(`${this.locationsUrl}/${id}`));
    }

    hardDeleteLocation(id: number): Observable<void> {
        return from(this.axiosService.delete<void>(`${this.locationsUrl}/${id}/hard`));
    }

    // --- BUILDINGS ---

    getAllBuildings(enabledOnly = false): Observable<EdificioDTO[]> {
        return from(this.axiosService.get<EdificioDTO[]>(this.buildingsUrl, { params: { enabledOnly } }));
    }

    getBuildingsByLocation(locationId: number, enabledOnly = false): Observable<EdificioDTO[]> {
        return from(this.axiosService.get<EdificioDTO[]>(`${this.buildingsUrl}/location/${locationId}`, { params: { enabledOnly } }));
    }

    getBuildingOptions(locationId: number): Observable<SelectOptionDTO[]> {
        return from(this.axiosService.get<SelectOptionDTO[]>(`${this.buildingsUrl}/location/${locationId}/options`));
    }

    getBuildingById(id: number): Observable<EdificioDTO> {
        return from(this.axiosService.get<EdificioDTO>(`${this.buildingsUrl}/${id}`));
    }

    createBuilding(building: EdificioDTO): Observable<EdificioDTO> {
        return from(this.axiosService.post<EdificioDTO>(this.buildingsUrl, building));
    }

    updateBuilding(id: number, building: EdificioDTO): Observable<EdificioDTO> {
        return from(this.axiosService.put<EdificioDTO>(`${this.buildingsUrl}/${id}`, building));
    }

    softDeleteBuilding(id: number): Observable<void> {
        return from(this.axiosService.delete<void>(`${this.buildingsUrl}/${id}`));
    }

    hardDeleteBuilding(id: number): Observable<void> {
        return from(this.axiosService.delete<void>(`${this.buildingsUrl}/${id}/hard`));
    }
}
