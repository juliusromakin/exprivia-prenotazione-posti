import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AxiosService } from './axios.service';
import { Reservation, ReservationRequest } from '@core/models';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly BASE_URL = '/api/reservations';

    constructor(private axiosService: AxiosService) { }

    /**
     * Retrieves all reservations
     */
    getReservations(): Observable<Reservation[]> {
        return from(this.axiosService.get<Reservation[]>(this.BASE_URL)).pipe(
            catchError(error => {
                console.error('Error retrieving reservations:', error);
                return throwError(() => new Error('Unable to retrieve reservations'));
            })
        );
    }

    /**
     * Retrieves reservations for a specific user email
     */
    getReservationsByEmail(email: string): Observable<Reservation[]> {
        return from(this.axiosService.get<Reservation[]>(`${this.BASE_URL}/user?email=${email}`)).pipe(
            catchError(error => {
                console.error('Error retrieving user reservations:', error);
                return throwError(() => new Error('Unable to retrieve user reservations'));
            })
        );
    }

    /**
     * Retrieves a specific reservation by ID
     */
    getReservationById(id: number): Observable<Reservation> {
        return from(this.axiosService.get<Reservation>(`${this.BASE_URL}/${id}`)).pipe(
            catchError(error => {
                console.error(`Error retrieving reservation ${id}:`, error);
                return throwError(() => new Error('Reservation not found'));
            })
        );
    }

    /**
     * Retrieves reservations for a specific day
     */
    getReservationsByDay(date: string): Observable<Reservation[]> {
        return from(this.axiosService.get<Reservation[]>(`${this.BASE_URL}/day?date=${date}`)).pipe(
            catchError(error => {
                console.error('Error retrieving reservations for the day:', error);
                return throwError(() => new Error('Unable to retrieve reservations for the day'));
            })
        );
    }

    /**
     * Retrieves available time slots for a workspace on a specific date
     */
    getAvailableTimeSlots(date: Date, workspaceId: number): Observable<string[]> {
        const formattedDate = date.toISOString().split('T')[0];
        return from(this.axiosService.get<string[]>(
            `${this.BASE_URL}/available-times?workspaceId=${workspaceId}&date=${formattedDate}`
        )).pipe(
            catchError(error => {
                console.error('Error retrieving available time slots:', error);
                return throwError(() => new Error('Unable to retrieve available time slots'));
            })
        );
    }

    /**
     * Creates a new reservation
     */
    createReservation(reservation: ReservationRequest): Observable<Reservation> {
        return from(this.axiosService.post<Reservation>(this.BASE_URL, reservation)).pipe(
            catchError(error => {
                console.error('Error creating reservation:', error);
                const message = error.response?.data?.message || 'Unable to create reservation';
                return throwError(() => new Error(message));
            })
        );
    }

    /**
     * Updates an existing reservation
     */
    updateReservation(id: number, updates: Reservation): Observable<Reservation> {
        return from(this.axiosService.put<Reservation>(`${this.BASE_URL}/${id}`, updates)).pipe(
            catchError(error => {
                console.error('Error updating reservation:', error);
                const message = error.response?.data?.message || 'Unable to update reservation';
                return throwError(() => new Error(message));
            })
        );
    }

    /**
     * Deletes a reservation
     */
    deleteReservation(id: number): Observable<void> {
        return from(this.axiosService.delete(`${this.BASE_URL}/${id}`)).pipe(
            map(() => void 0),
            catchError(error => {
                console.error('Error deleting reservation:', error);
                return throwError(() => new Error('Unable to delete reservation'));
            })
        );
    }

    /**
     * Exports daily reservations to Excel format
     */
    exportReservationsDaily(date: Date): Observable<Blob> {
        const formattedDate = date.toISOString().split('T')[0];
    
        return from(this.axiosService.get<Blob>(
            `${this.BASE_URL}/export-excel?date=${formattedDate}`,
            { responseType: 'blob' }
        ));
    }

    /**
     * Retrieves reservations for a specific day and workspace
     */
    getReservationsByDayAndWorkspace(date: string, workspaceId: number): Observable<Reservation[]> {
        return from(this.axiosService.get<Reservation[]>(`${this.BASE_URL}/day-workspace?date=${date}&workspaceId=${workspaceId}`)).pipe(
            catchError(error => {
                console.error('Error retrieving reservations for the day and workspace:', error);
                return throwError(() => new Error('Unable to retrieve reservations for the day and workspace'));
            })
        );
    }
}
