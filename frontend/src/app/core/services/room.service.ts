// frontend/src/app/core/services/room.service.ts

import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import { map, tap } from "rxjs/operators";
import { AxiosService } from "./axios.service";
// IMPORTANTE: Import dai modelli centralizzati
import { Room, RoomWithWorkspaces } from "../models";

@Injectable({
    providedIn: "root",
})
export class RoomService {
    private readonly baseUrl = "/api/rooms";

    constructor(private axiosService: AxiosService) { }

    /**
     * Recupera tutte le stanze
     */
    getAllRooms(): Observable<Room[]> {
        return from(this.axiosService.get<Room[]>(this.baseUrl)).pipe(
            tap({
                error: (error) => console.error("Error fetching rooms:", error),
            })
        );
    }

    /**
     * Recupera una stanza specifica per ID (inclusi i dettagli base)
     */
    getRoomById(id: number): Observable<Room> {
        return from(this.axiosService.get<Room>(`${this.baseUrl}/${id}`));
    }

    /**
     * NUOVO: Recupera una stanza con tutte le sue postazioni (Eager loading)
     */
    getRoomWithWorkspaces(id: number): Observable<RoomWithWorkspaces> {
        return from(this.axiosService.get<RoomWithWorkspaces>(`${this.baseUrl}/${id}/workspaces`));
    }

    /**
     * Recupera opzioni extra per le stanze (es. tipi disponibili)
     */
    getRoomOptions(): Observable<any> {
        return from(this.axiosService.get<any>(`${this.baseUrl}/options`));
    }

    /**
     * Crea una nuova stanza
     */
    createRoom(room: Partial<Room>): Observable<Room> {
        return from(this.axiosService.post<Room>(this.baseUrl, room));
    }

    /**
     * Aggiorna una stanza esistente
     */
    updateRoom(id: number, updates: Partial<Room>): Observable<Room> {
        return from(this.axiosService.put<Room>(`${this.baseUrl}/${id}`, updates));
    }

    /**
     * Soft delete (disattiva la stanza)
     */
    deleteRoom(id: number): Observable<void> {
        return from(this.axiosService.delete(`${this.baseUrl}/${id}`)).pipe(
            map(() => void 0)
        );
    }

    /**
     * Recupera i tipi di stanza distinti presenti in un piano specifico
     */
    getRoomTypesByFloor(floorId: number): Observable<any[]> {
        return from(this.axiosService.get<any[]>(`${this.baseUrl}/floor/${floorId}/types`));
    }

    /**
     * Hard delete (rimuove definitivamente dal DB)
     */
    hardDeleteRoom(id: number): Observable<void> {
        return from(this.axiosService.delete(`${this.baseUrl}/${id}/hard`)).pipe(
            map(() => void 0)
        );
    }
}