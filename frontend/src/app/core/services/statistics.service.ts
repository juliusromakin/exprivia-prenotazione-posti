import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosService } from './axios.service';
import { StatisticsCount, RoomStats } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly BASE_URL = '/api/statistics';

  constructor(private axiosService: AxiosService) {}

  /**
   * Get number of reservations per day
   * @param startDate ISO date string
   */
  getReservationsPerDay(startDate?: string): Observable<StatisticsCount[]> {
    let url = `${this.BASE_URL}/reservations-per-day`;
    if (startDate) {
      url += `?startDate=${startDate}`;
    }
    
    return from(this.axiosService.get<StatisticsCount[]>(url)).pipe(
      catchError(error => {
        console.error('Error fetching reservations per day:', error);
        return throwError(() => new Error('Unable to fetch daily statistics'));
      })
    );
  }

  /**
   * Get list of most booked rooms
   */
  getMostBookedRooms(): Observable<RoomStats[]> {
    return from(this.axiosService.get<RoomStats[]>(`${this.BASE_URL}/most-booked-rooms`)).pipe(
      catchError(error => {
        console.error('Error fetching most booked rooms:', error);
        return throwError(() => new Error('Unable to fetch room statistics'));
      })
    );
  }
}
