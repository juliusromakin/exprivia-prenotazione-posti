import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import { map, tap } from "rxjs/operators";
import { AxiosService } from "./axios.service";
import { Room, RoomWithWorkspaces } from "@core/models";
import { TokenService } from "../auth/token.service";

@Injectable({
    providedIn: "root",
})
export class RoomService {
    private readonly baseUrl = "/api/rooms";

    constructor(
        private axiosService: AxiosService,
        private tokenService: TokenService
    ) { }

    getAllRooms(): Observable<Room[]> {
        return from(this.axiosService.get<Room[]>(this.baseUrl)).pipe(
            tap({
                next: (response) => console.log("Rooms response:", response),
                error: (error) => console.error("Error fetching rooms:", error),
            })
        );
    }

    getRoomOptions(): Observable<any> {
        return from(this.axiosService.get<any>(`${this.baseUrl}/options`));
    }

    getRoomById(id: number): Observable<Room> {
        return from(this.axiosService.get<Room>(`${this.baseUrl}/${id}`));
    }

    createRoom(room: Partial<Room>): Observable<Room> {
        return from(
            this.axiosService.post<Room>(this.baseUrl, room)
        );
    }

    updateRoom(id: number, updates: Partial<Room>): Observable<Room> {
        return from(
            this.axiosService.put<Room>(
                `${this.baseUrl}/${id}`,
                updates
            )
        );
    }

    deleteRoom(id: number): Observable<void> {
        return from(
            this.axiosService.delete(`${this.baseUrl}/${id}`)
        ).pipe(map(() => void 0));
    }

    hardDeleteRoom(id: number): Observable<void> {
        return from(
            this.axiosService.delete(`${this.baseUrl}/${id}/hard`)
        ).pipe(map(() => void 0));
    }
}
