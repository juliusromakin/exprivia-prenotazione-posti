// frontend/src/app/core/services/reservation.service.ts

import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AxiosService } from './axios.service';
// IMPORTANTE: Import dai modelli centralizzati
import { Reservation, ReservationRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private readonly BASE_URL = '/api/reservations';

    constructor(private axiosService: AxiosService) { }

    /**
     * Recupera tutte le prenotazioni
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
     * Recupera le prenotazioni per una specifica email utente
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
     * Recupera una prenotazione specifica tramite ID
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
     * Recupera le prenotazioni per un giorno specifico (formato stringa YYYY-MM-DD)
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
     * Recupera gli slot orari disponibili per una postazione in una certa data
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
     * Crea una nuova prenotazione
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
     * Aggiorna una prenotazione esistente
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
     * Elimina una prenotazione
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
     * Esporta le prenotazioni giornaliere in formato Excel
     */
    exportReservationsDaily(date: Date): Observable<Blob> {
        const formattedDate = date.toISOString().split('T')[0];

        return from(this.axiosService.get<Blob>(
            `${this.BASE_URL}/export-excel?date=${formattedDate}`,
            { responseType: 'blob' }
        )).pipe(
            catchError(error => {
                console.error('Error exporting reservations:', error);
                return throwError(() => new Error('Unable to export Excel file'));
            })
        );
    }

    /**
     * Recupera le prenotazioni per giorno e postazione specifica
     */
    getReservationsByDayAndWorkspace(date: string, workspaceId: number): Observable<Reservation[]> {
        return from(this.axiosService.get<Reservation[]>(`${this.BASE_URL}/day-workspace?date=${date}&workspaceId=${workspaceId}`)).pipe(
            catchError(error => {
                console.error('Error retrieving reservations for day and workspace:', error);
                return throwError(() => new Error('Unable to retrieve reservations for specific workspace'));
            })
        );
    }
}