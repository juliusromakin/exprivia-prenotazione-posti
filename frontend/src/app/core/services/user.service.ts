import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AxiosService } from './axios.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = '/api/user';

  constructor(private axiosService: AxiosService) { }

  getCurrentUser(): Observable<User> {
    return from(this.axiosService.get<User>(`${this.baseUrl}/current`));
  }

  updateUser(id: number, updates: Partial<User>): Observable<User> {
    return from(this.axiosService.put<User>(`${this.baseUrl}/${id}`, updates));
  }

  deleteOwnAccount(): Observable<void> {
    return from(this.axiosService.delete<void>(`${this.baseUrl}/personal`));
  }
}