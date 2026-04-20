import { User, Workspace, Room, ReservationStatus, Reservation } from '@core/models';

export interface ReservationWithDetails extends Omit<Reservation, 'userSummary'> {
    user: Required<User>;
    workspace: Required<Workspace>;
    room: Required<Room>;
    status: ReservationStatus;
    startDate: string;
    endDate: string;
}

export interface BookingFormData {
    roomType: string;
    roomId: number;
    workspaceId: number;
    timeSlot: string;
    selectedDate: Date;
    slotDuration: string;
    userId?: number;
}

export interface BookingState {
    rooms: Room[];
    availableWorkspaces: WorkspaceWithAvailability[];
    selectedDates: Date[];
    availableTimeSlots: any[];
    isLoading: boolean;
    errorMessage: string;
}

export interface WorkspaceWithAvailability extends Workspace {
    roomId: number;
    roomName: string;
    roomType: string;
    isAvailable?: boolean;
}

export interface BookingValidationError {
    field: keyof BookingFormData;
    message: string;
}

export interface ReservationRequest {
    roomId: number;
    workspaceId: number;
    startDate: string;
    endDate: string;
    durationName?: string | null;
    userId?: number;
}