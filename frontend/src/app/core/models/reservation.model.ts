import { ReservationDuration } from './reservation-duration.model';

export enum ReservationStatus {
    CONFIRMED = 'CONFIRMED',
    NOT_CONFIRMED = 'NOT_CONFIRMED',
    DENIED = 'DENIED'
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
}

// Simplified user info from backend (UserSummaryDTO)
export interface UserSummary {
    id: number;
    name: string;
    lastName: string;
    email: string;
}

// Simplified workspace info from backend
export interface WorkspaceSummary {
    id: number;
    name: string;
}

// Simplified room info from backend
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
    workspaceSummary?: WorkspaceSummary;
    roomSummary?: RoomSummary;
}

export interface ReservationRequest {
    workspaceId: number;
    userId: number;
    startDate: string;
    endDate: string;
    durationName: string;
}

export interface ReservationResponse extends Reservation {
    id: number;
}

export interface ReservationFilter {
    startDate?: Date;
    endDate?: Date;
    workspaceId?: number;
    roomId?: number;
    userId?: number;
    status?: ReservationStatus;
} 