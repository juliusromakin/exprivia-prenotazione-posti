import { ReservationDuration } from './reservation-duration.model';
import { ReservationStatus } from './enums';
import { UserSummary } from './user.model';

export interface TimeSlot {
    startTime: string;
    endTime: string;
}


export interface WorkspaceSummary {
    id: number;
    name: string;
}

export interface RoomSummary {
    id: number;
    name: string;
    roomType: string;
}

export interface Reservation {
    id?: number;
    startDate: Date | string;
    endDate: Date | string;
    status: ReservationStatus;
    userId: number;
    workspaceId: number;
    durationName?: string;
    userSummary?: UserSummary;
    bookedBySummary?: UserSummary;
    workspaceSummary?: WorkspaceSummary;
    roomSummary?: RoomSummary;
    cityName?: string;
    locationName?: string;
}

// Modello per la creazione di una nuova prenotazione (POST)
export interface ReservationRequest {
    workspaceId: number;
    userId: number;
    startDate: string | Date; // Accetta Date per facilitare i form Angular
    endDate: string | Date;
    durationName: string;
}

// Modello per la risposta specifica
export interface ReservationResponse extends Reservation {
    id: number; // Qui l'ID è sempre garantito perché arriva dal DB
}

// Modello per i filtri UI
export interface ReservationFilter {
    startDate?: Date | string;
    endDate?: Date | string;
    workspaceId?: number;
    roomId?: number;
    userId?: number;
    status?: ReservationStatus;
}