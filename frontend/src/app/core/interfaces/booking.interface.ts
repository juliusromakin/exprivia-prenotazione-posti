import { Workspace, User } from '@core/models';

export interface BookingDetail {
  id?: number;
  user: User;
  workspace: Workspace;
  startDate: string;
  endDate: string;
  reservationStatus: string;
}

export interface TimeSlotBooking {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface UserBooking {
  id: number;
  date: Date;
  startTime: string;
  endTime: string;
  workspace: string;
  status: string;
}

export interface DateAvailability {
  date: Date;
  availableSlots: number;
  totalSlots: number;
}

export interface AvailabilityStatus {
  level: 'none' | 'low' | 'medium' | 'high';
  text: string;
  description: string;
  dotClass: string;
}

export interface BookingFormData {
  roomType: string;
  floor: string;
  workspaceId: string;
  startTime: string;
  employees: string[];
} 