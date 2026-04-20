import { Injectable } from '@angular/core';
import { Observable, from, forkJoin, throwError, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { AxiosService } from '@core/services/axios.service';
import { Reservation, ReservationStatus, TimeSlot, Room, Workspace, RoomWithWorkspaces } from '@core/models';
import { RoomService } from '@core/services/room.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { ReservationService } from '@core/services/reservation.service';

@Injectable({
  providedIn: 'root'
})
export class PrenotazionePosizioneService {
    private readonly WORKING_HOURS = {
        START: 8,
        END: 18
    };

  constructor(
    private roomService: RoomService,
    private workspaceService: WorkspaceService,
    private reservationService: ReservationService
  ) {}

  /**
   * Retrieves all rooms with their workspaces
   */
  getRoomsWithWorkspaces(): Observable<{rooms: RoomWithWorkspaces[]}> {
    return this.roomService.getAllRooms().pipe(
      map(rooms => ({ rooms: rooms as RoomWithWorkspaces[] }))
    );
  }

    getUserReservations(): Observable<Reservation[]> {
        return this.reservationService.getReservations();
    }

    getWorkspacesByRoom(roomId: number, rooms: RoomWithWorkspaces[]): any[] {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return [];

        return (room.workspaces || [])
            .filter(w => w.id && w.name)
            .map(w => ({
                id: w.id!,
                name: w.name!,
                roomId: roomId,
                roomName: room.name,
                roomType: room.roomType
            }));
    }

    getAvailableTimeSlots(date: Date, workspaceId: number): Observable<TimeSlot[]> {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        return this.reservationService.getReservationsByDayAndWorkspace(formattedDate, workspaceId).pipe(
            map((reservations: Reservation[]) => {
                if (!reservations || reservations.length === 0) {
                    return this.generateTimeSlots([]);
                }

                // Filter out cancelled reservations
                const activeReservations = reservations.filter((r: Reservation) => 
                    r.status !== ReservationStatus.DENIED
                );
                
                if (activeReservations.length === 0) {
                    return this.generateTimeSlots([]);
                }

                const occupiedSlots = activeReservations.map((r: Reservation) => {
                    let startDate = new Date(r.startDate as string);
                    let endDate = new Date(r.endDate as string);

                    const startHour = startDate.getHours();
                    const endHour = endDate.getHours();

                    if (isNaN(startHour) || isNaN(endHour)) {
                        return null;
                    }

                    return {
                        start: startHour,
                        end: endHour
                    };
                }).filter(slot => slot !== null) as { start: number; end: number }[];

                return this.generateTimeSlots(occupiedSlots);
            })
        );
    }

    createReservation(reservation: any): Observable<void> {
        return this.reservationService.createReservation(reservation).pipe(
            map(() => void 0)
        );
    }

    private generateTimeSlots(occupiedSlots: { start: number; end: number }[]): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const startHour = this.WORKING_HOURS.START;
        const endHour = this.WORKING_HOURS.END;
        const slotDurations = [600, 240, 120, 60, 30]; // minutes

        function overlaps(startA: number, endA: number, startB: number, endB: number) {
            return startA < endB && endA > startB;
        }

        function toMinutes(hour: number): number {
            return Math.floor(hour) * 60 + (hour % 1 === 0.5 ? 30 : 0);
        }

        function isSlotAvailable(slotStart: number, slotEnd: number): boolean {
            const slotStartMinutes = toMinutes(slotStart);
            const slotEndMinutes = toMinutes(slotEnd);
            
            return !occupiedSlots.some(occupied => {
                const occStart = toMinutes(occupied.start);
                const occEnd = toMinutes(occupied.end);
                return overlaps(slotStartMinutes, slotEndMinutes, occStart, occEnd);
            });
        }

        for (const duration of slotDurations) {
            const step = duration >= 60 ? 60 : 30;
            for (let hour = startHour; hour < endHour; hour += step / 60) {
                const start = hour;
                const end = hour + duration / 60;
                if (end > endHour) continue;

                if (isSlotAvailable(start, end)) {
                    const startTime = `${Math.floor(start).toString().padStart(2, '0')}:${(start % 1 === 0.5 ? '30' : '00')}`;
                    const endTime = `${Math.floor(end).toString().padStart(2, '0')}:${(end % 1 === 0.5 ? '30' : '00')}`;
                    
                    if (!slots.some(s => s.startTime === startTime && s.endTime === endTime)) {
                        slots.push({ startTime, endTime });
                    }
                }
            }
        }

        // Standard full day handling
        if (isSlotAvailable(8, 17)) {
            const slot = { startTime: '08:00', endTime: '17:00' };
            if (!slots.some(s => s.startTime === slot.startTime && s.endTime === slot.endTime)) {
                slots.push(slot);
            }
        }
        if (isSlotAvailable(9, 18)) {
            const fullDaySlot = { startTime: '09:00', endTime: '18:00' };
            if (!slots.some(s => s.startTime === fullDaySlot.startTime && s.endTime === fullDaySlot.endTime)) {
                slots.push(fullDaySlot);
            }
        }

        slots.sort((a, b) => {
            const durA = toMinutes(parseInt(b.endTime.split(':')[0]) + parseInt(b.endTime.split(':')[1]) / 60) - 
                        toMinutes(parseInt(a.startTime.split(':')[0]) + parseInt(a.startTime.split(':')[1]) / 60);
            const durB = toMinutes(parseInt(b.endTime.split(':')[0]) + parseInt(b.endTime.split(':')[1]) / 60) - 
                        toMinutes(parseInt(b.startTime.split(':')[0]) + parseInt(b.startTime.split(':')[1]) / 60);
            if (durA !== durB) return durB - durA;
            return a.startTime.localeCompare(b.startTime);
        });

        return slots;
    }

    getReservationInfo(): Observable<{rooms: RoomWithWorkspaces[], durations: any[]}> {
        return forkJoin({
            rooms: this.roomService.getAllRooms().pipe(map(r => r as RoomWithWorkspaces[])),
            durations: of([]) // Placeholder for duration info
        });
    }

    deleteReservation(id: number): Observable<void> {
        return this.reservationService.deleteReservation(id);
    }
} 