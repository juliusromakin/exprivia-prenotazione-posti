// frontend/src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AxiosService } from './axios.service';
// IMPORTANTE: Importiamo i modelli corretti dal file centralizzato
import { User, UserUpdate, ResetPasswordRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = '/api/user';

  constructor(private axiosService: AxiosService) { }

  /**
   * Recupera i dati dell'utente attualmente loggato (dal JWT)
   */
  getCurrentUser(): Observable<User> {
    return from(this.axiosService.get<User>(`${this.baseUrl}/current`));
  }

  /**
   * Aggiorna il profilo dell'utente (usa UserUpdate per i campi corretti)
   */
  updateUser(id: number, updates: UserUpdate): Observable<User> {
    return from(this.axiosService.put<User>(`${this.baseUrl}/${id}`, updates));
  }

  /**
   * Permette all'utente di cancellare il proprio account
   */
  deleteOwnAccount(): Observable<void> {
    return from(this.axiosService.delete<void>(`${this.baseUrl}/personal`));
  }

  /**
   * Gestisce il reset della password
   */
  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return from(this.axiosService.post<void>(`${this.baseUrl}/reset-password`, request));
  }
}