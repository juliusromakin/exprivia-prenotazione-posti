import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AxiosService } from './axios.service';
import { ReservationDuration, ReservationDurationDTO } from '../models/reservation-duration.model';

@Injectable({
    providedIn: 'root'
})
export class ReservationDurationService {
    private readonly BASE_URL = '/api/reservation-duration';

    constructor(private axiosService: AxiosService) {}

    getAllDurations(): Observable<ReservationDuration[]> {
        return from(this.axiosService.get<ReservationDuration[]>(this.BASE_URL));
    }

    getDurationByName(name: string): Observable<ReservationDuration> {
        return from(this.axiosService.get<ReservationDuration>(`${this.BASE_URL}/${name}`));
    }

    createDuration(reservationDuration: ReservationDurationDTO): Observable<ReservationDuration> {
        return from(this.axiosService.post<ReservationDuration>(this.BASE_URL, reservationDuration));
    }

    updateDuration(name: string, reservationDuration: ReservationDurationDTO): Observable<ReservationDuration> {
        return from(this.axiosService.put<ReservationDuration>(`${this.BASE_URL}/${name}`, reservationDuration));
    }

    deleteDuration(name: string): Observable<void> {
        return from(this.axiosService.delete<void>(`${this.BASE_URL}/${name}`));
    }

    getDurationsByReservation(reservationId: number): Observable<ReservationDuration[]> {
        return from(this.axiosService.get<ReservationDuration[]>(`${this.BASE_URL}/reservation/${reservationId}`));
    }
}